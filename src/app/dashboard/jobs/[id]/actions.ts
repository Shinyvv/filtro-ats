"use server";

import { JobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";
import { jobSchema } from "@/lib/validations/job.schema";

async function assertJobOwnership(jobId: string, companyId: string): Promise<void> {
  const job = await prisma.job.findFirst({
    where: { id: jobId, companyId },
    select: { id: true },
  });

  if (!job) {
    redirect("/dashboard/jobs");
  }
}

export async function updateJobAction(jobId: string, formData: FormData): Promise<never> {
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);
  await assertJobOwnership(jobId, companyId);

  const parsed = jobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    location: formData.get("location"),
    modality: formData.get("modality"),
    contractType: formData.get("contractType"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect(`/dashboard/jobs/${jobId}/edit?error=validation`);
  }

  await prisma.job.update({
    where: { id: jobId },
    data: parsed.data,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${jobId}`);
  revalidatePath(`/dashboard/jobs/${jobId}/edit`);
  redirect(`/dashboard/jobs/${jobId}`);
}

export async function closeJobAction(jobId: string): Promise<void> {
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);
  await assertJobOwnership(jobId, companyId);

  await prisma.job.update({
    where: { id: jobId },
    data: { status: JobStatus.CLOSED },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  revalidatePath(`/dashboard/jobs/${jobId}`);
}
