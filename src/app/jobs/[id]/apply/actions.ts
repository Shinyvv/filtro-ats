"use server";

import { CandidateStatus, JobStatus, Prisma, type Candidate } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { evaluateCandidate } from "@/lib/ai/candidate-evaluator";
import { logAiUsage } from "@/lib/ai/usage-logger";
import { checkAiDailyQuota } from "@/lib/ai/usage-quota";
import { normalizeCvText } from "@/lib/cv/cv-text";
import { parseCvFile } from "@/lib/cv/cv-parser";
import { prisma } from "@/lib/prisma/prisma";
import { checkApplyRateLimit } from "@/lib/ratelimit/rate-limiter";
import { localStorageProvider } from "@/lib/storage/local-storage-provider";
import type { SaveFileResult } from "@/lib/storage/storage-provider";
import {
  publicCandidateApplicationSchema,
  publicJobIdSchema,
} from "@/lib/validations/candidate.schema";

type ApplyErrorCode =
  | "closed"
  | "duplicate"
  | "email"
  | "file"
  | "file_required"
  | "file_size"
  | "name"
  | "rate_limit"
  | "server"
  | "validation";

function getApplyPath(jobId: string, error: ApplyErrorCode): string {
  return `/jobs/${encodeURIComponent(jobId)}/apply?error=${error}`;
}

function parseOptionalNumber(value: FormDataEntryValue | null): number | undefined {
  if (typeof value !== "string" || value.trim().length === 0) {
    return undefined;
  }

  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    return Number.NaN;
  }

  return parsed;
}

function getValidationErrorCode(
  parsed: ReturnType<typeof publicCandidateApplicationSchema.safeParse>,
): ApplyErrorCode {
  if (parsed.success) {
    return "validation";
  }

  const issue = parsed.error.issues[0];
  const field = issue?.path[0];
  const message = issue?.message ?? "";

  if (field === "fullName") {
    return "name";
  }

  if (field === "email") {
    return "email";
  }

  if (field === "cvFile") {
    if (message.includes("adjuntar")) {
      return "file_required";
    }

    if (message.includes("superar")) {
      return "file_size";
    }

    return "file";
  }

  return "validation";
}

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headerList.get("x-real-ip")?.trim() || "unknown";
}

async function cleanupSavedCv(filePath: string): Promise<void> {
  try {
    await localStorageProvider.deleteFile(filePath);
  } catch (error) {
    console.error("apply-cleanup-cv:error", error);
  }
}

export async function applyToJobAction(jobId: string, formData: FormData): Promise<never> {
  const parsedJobId = publicJobIdSchema.safeParse(jobId);
  const safeJobId = parsedJobId.success ? parsedJobId.data : jobId;

  if (!parsedJobId.success) {
    redirect(getApplyPath(safeJobId || "invalid", "closed"));
  }

  const ip = await getClientIp();

  const rl = checkApplyRateLimit(ip, safeJobId);
  if (!rl.allowed) {
    redirect(getApplyPath(safeJobId, "rate_limit"));
  }

  const job = await prisma.job.findFirst({
    where: {
      id: safeJobId,
      status: JobStatus.ACTIVE,
    },
    select: {
      id: true,
      companyId: true,
      title: true,
      description: true,
      requirements: true,
      company: {
        select: {
          id: true,
        },
      },
    },
  });

  if (!job?.company?.id) {
    redirect(getApplyPath(safeJobId, "closed"));
  }

  const rawFile = formData.get("cvFile");
  const cvFile = rawFile instanceof File ? rawFile : undefined;
  const parsed = publicCandidateApplicationSchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    currentPosition: formData.get("currentPosition"),
    yearsOfExperience: parseOptionalNumber(formData.get("yearsOfExperience")),
    expectedSalary: parseOptionalNumber(formData.get("expectedSalary")),
    availability: formData.get("availability"),
    cvFile,
  });

  if (!parsed.success) {
    redirect(getApplyPath(job.id, getValidationErrorCode(parsed)));
  }

  const existingCandidate = await prisma.candidate.findFirst({
    where: { jobId: job.id, email: parsed.data.email },
    select: { id: true },
  });

  if (existingCandidate) {
    redirect(getApplyPath(job.id, "duplicate"));
  }

  const fileValidation = localStorageProvider.validateFile(parsed.data.cvFile);
  if (!fileValidation.valid) {
    redirect(getApplyPath(job.id, "file"));
  }

  let savedFile: SaveFileResult;
  try {
    savedFile = await localStorageProvider.saveFile(parsed.data.cvFile);
  } catch (error) {
    console.error("apply-save-cv:error", error);
    redirect(getApplyPath(job.id, "server"));
  }

  const cvParsed = await parseCvFile({
    filePath: savedFile.filePath,
    mimeType: savedFile.mimeType,
  });
  const normalizedCv = normalizeCvText(cvParsed.text);

  let candidate: Candidate;

  try {
    candidate = await prisma.candidate.create({
      data: {
        jobId: job.id,
        fullName: parsed.data.fullName,
        email: parsed.data.email,
        phone: parsed.data.phone ?? "",
        currentPosition: parsed.data.currentPosition ?? "",
        yearsOfExperience: parsed.data.yearsOfExperience,
        expectedSalary: parsed.data.expectedSalary,
        availability: parsed.data.availability,
        cvFileName: savedFile.fileName,
        cvFilePath: savedFile.filePath,
        cvMimeType: savedFile.mimeType,
        cvText: cvParsed.text,
        status: CandidateStatus.NEW,
      },
    });
  } catch (error) {
    await cleanupSavedCv(savedFile.filePath);

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(getApplyPath(job.id, "duplicate"));
    }

    console.error("apply-create-candidate:error", error);
    redirect(getApplyPath(job.id, "server"));
  }

  try {
    const quota = await checkAiDailyQuota(job.id);

    if (!quota.allowed) {
      await logAiUsage({
        jobId: job.id,
        companyId: job.companyId,
        candidateId: candidate.id,
        ip,
        model: "none",
        action: "apply_evaluate",
        inputChars: normalizedCv.finalChars,
        outputChars: 0,
        cvWasTruncated: normalizedCv.wasTruncated,
        status: "error",
        errorMessage: `quota_exceeded:${quota.reason ?? "unknown"}`,
      });
    } else {
      const evaluation = await evaluateCandidate({
        jobTitle: job.title,
        jobDescription: job.description,
        jobRequirements: job.requirements,
        candidateCvText: normalizedCv.text,
        candidateFormData: {
          fullName: parsed.data.fullName,
          currentPosition: parsed.data.currentPosition ?? "",
          yearsOfExperience: parsed.data.yearsOfExperience,
          expectedSalary: parsed.data.expectedSalary,
          availability: parsed.data.availability,
        },
      });

      if (evaluation.status !== "error") {
        await prisma.candidate.update({
          where: { id: candidate.id },
          data: {
            aiScore: evaluation.score,
            aiSummary: evaluation.summary,
          },
        });
      }

      await logAiUsage({
        jobId: job.id,
        companyId: job.companyId,
        candidateId: candidate.id,
        ip,
        model: evaluation.model,
        action: "apply_evaluate",
        inputChars: normalizedCv.finalChars,
        outputChars: evaluation.outputChars,
        cvWasTruncated: normalizedCv.wasTruncated,
        status: evaluation.status,
        errorMessage: evaluation.errorMessage,
      });
    }
  } catch (error) {
    console.error("apply-optional-ai:error", error);
  }

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${job.id}/candidates`);
  revalidatePath(`/dashboard/jobs/${job.id}`);
  redirect(`/jobs/${job.id}/apply/success?success=1`);
}
