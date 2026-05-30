"use server";

import { CandidateStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { evaluateCandidate } from "@/lib/ai/candidate-evaluator";
import { parseCvFile } from "@/lib/cv/cv-parser";
import { prisma } from "@/lib/prisma/prisma";
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

export async function applyToJobAction(jobId: string, formData: FormData): Promise<never> {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
  });

  if (!job) {
    redirect("/login");
  }

  const rawFile = formData.get("cvFile");
  const cvFile = rawFile instanceof File ? rawFile : undefined;

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

  const fileValidation = localStorageProvider.validateFile(parsed.data.cvFile);
  if (!fileValidation.valid) {
    redirect(`/jobs/${jobId}/apply?error=file`);
  }

  const savedFile = await localStorageProvider.saveFile(parsed.data.cvFile);
  const cvParsed = await parseCvFile({
    filePath: savedFile.filePath,
    mimeType: savedFile.mimeType,
  });

  const evaluation = await evaluateCandidate({
    jobTitle: job.title,
    jobDescription: job.description,
    jobRequirements: job.requirements,
    candidateCvText: cvParsed.text,
    candidateFormData: {
      fullName: parsed.data.fullName,
      currentPosition: parsed.data.currentPosition,
      yearsOfExperience: parsed.data.yearsOfExperience,
      expectedSalary: parsed.data.expectedSalary,
      availability: parsed.data.availability,
    },
  });

  await prisma.candidate.create({
    data: {
      jobId: job.id,
      fullName: parsed.data.fullName,
      email: parsed.data.email,
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

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${job.id}/candidates`);
  revalidatePath(`/dashboard/jobs/${job.id}`);
  redirect(`/jobs/${job.id}/apply/success`);
}
