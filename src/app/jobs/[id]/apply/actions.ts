"use server";

import { CandidateStatus } from "@prisma/client";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { Prisma } from "@prisma/client";

import { evaluateCandidate } from "@/lib/ai/candidate-evaluator";
import { logAiUsage } from "@/lib/ai/usage-logger";
import { checkAiDailyQuota } from "@/lib/ai/usage-quota";
import { normalizeCvText } from "@/lib/cv/cv-text";
import { parseCvFile } from "@/lib/cv/cv-parser";
import { prisma } from "@/lib/prisma/prisma";
import { checkApplyRateLimit } from "@/lib/ratelimit/rate-limiter";
import { localStorageProvider } from "@/lib/storage/local-storage-provider";
import { candidateApplySchema } from "@/lib/validations/candidate.schema";

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

async function getClientIp(): Promise<string> {
  const headerList = await headers();
  const forwarded = headerList.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return headerList.get("x-real-ip")?.trim() || "unknown";
}

export async function applyToJobAction(jobId: string, formData: FormData): Promise<never> {
  const ip = await getClientIp();

  // 1) RATE LIMIT antes de cualquier trabajo costoso o llamada al LLM.
  const rl = checkApplyRateLimit(ip, jobId);
  if (!rl.allowed) {
    redirect(`/jobs/${jobId}/apply?error=rate_limit`);
  }

  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    redirect("/login");
  }

  const rawFile = formData.get("cvFile");
  const cvFile = rawFile instanceof File ? rawFile : undefined;

  // 2) VALIDACION Zod (incluye MIME y tamano del archivo).
  const parsed = candidateApplySchema.safeParse({
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    currentPosition: formData.get("currentPosition"),
    yearsOfExperience: parseOptionalNumber(formData.get("yearsOfExperience")),
    expectedSalary: parseOptionalNumber(formData.get("expectedSalary")),
    availability: formData.get("availability") || undefined,
    cvFile,
  });

  if (!parsed.success) {
    redirect(`/jobs/${jobId}/apply?error=validation`);
  }

  // Normalizar email para deduplicar (minusculas + sin espacios).
  const email = parsed.data.email.trim().toLowerCase();

  // 2a) ANTI-DUPLICADO: si ya postulo a este cargo, cortar lo antes posible
  // (antes de guardar archivo, parsear CV o llamar a IA/Gemini).
  const existingCandidate = await prisma.candidate.findFirst({
    where: { jobId: job.id, email },
    select: { id: true },
  });

  if (existingCandidate) {
    redirect(`/jobs/${job.id}/apply/success?duplicate=1`);
  }

  // 2b) Validacion adicional de archivo (defensa en profundidad).
  const fileValidation = localStorageProvider.validateFile(parsed.data.cvFile);
  if (!fileValidation.valid) {
    redirect(`/jobs/${jobId}/apply?error=file`);
  }

  const savedFile = await localStorageProvider.saveFile(parsed.data.cvFile);
  const cvParsed = await parseCvFile({
    filePath: savedFile.filePath,
    mimeType: savedFile.mimeType,
  });

  // 3) NORMALIZACION + TRUNCADO del texto del CV antes del modelo.
  const normalizedCv = normalizeCvText(cvParsed.text);

  // 4) CUOTA diaria (por job y global) antes de llamar a Gemini.
  const quota = await checkAiDailyQuota(job.id);
  if (!quota.allowed) {
    await logAiUsage({
      jobId: job.id,
      companyId: job.companyId,
      ip,
      model: "none",
      action: "apply_evaluate",
      inputChars: normalizedCv.finalChars,
      outputChars: 0,
      cvWasTruncated: normalizedCv.wasTruncated,
      status: "error",
      errorMessage: `quota_exceeded:${quota.reason ?? "unknown"}`,
    });
    redirect(`/jobs/${jobId}/apply?error=quota`);
  }

  // 5) Evaluacion IA (con timeout/retry y fallback dentro del evaluador).
  const evaluation = await evaluateCandidate({
    jobTitle: job.title,
    jobDescription: job.description,
    jobRequirements: job.requirements,
    candidateCvText: normalizedCv.text,
    candidateFormData: {
      fullName: parsed.data.fullName,
      currentPosition: parsed.data.currentPosition,
      yearsOfExperience: parsed.data.yearsOfExperience,
      expectedSalary: parsed.data.expectedSalary,
      availability: parsed.data.availability,
    },
  });

  let candidate;

  try {
    candidate = await prisma.candidate.create({
      data: {
        jobId: job.id,
        fullName: parsed.data.fullName,
        email,
        phone: parsed.data.phone,
        currentPosition: parsed.data.currentPosition,
        yearsOfExperience: parsed.data.yearsOfExperience,
        expectedSalary: parsed.data.expectedSalary,
        availability: parsed.data.availability,
        cvFileName: savedFile.fileName,
        cvFilePath: savedFile.filePath,
        cvMimeType: savedFile.mimeType,
        cvText: cvParsed.text,
        aiScore: evaluation.score,
        aiSummary: evaluation.summary,
        status: CandidateStatus.NEW,
      },
    });
  } catch (error) {
    // Condicion de carrera: dos requests casi simultaneas pasan el findFirst
    // pero PostgreSQL bloquea el segundo via @@unique([jobId, email]).
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      redirect(`/jobs/${job.id}/apply/success?duplicate=1`);
    }

    throw error;
  }

  // 6) REGISTRO de uso IA (no rompe el flujo si falla).
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${job.id}/candidates`);
  revalidatePath(`/dashboard/jobs/${job.id}`);
  redirect(`/jobs/${job.id}/apply/success`);
}
