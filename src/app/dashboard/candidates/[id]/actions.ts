"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";
import { candidateStatusSchema } from "@/lib/validations/candidate.schema";

const candidateIdSchema = z
  .string()
  .min(1, "Candidate id is required")
  .max(100, "Candidate id is invalid");

export async function updateCandidateStatusAction(formData: FormData): Promise<void> {
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const candidateId = candidateIdSchema.safeParse(formData.get("candidateId"));
  const parsedStatus = candidateStatusSchema.safeParse({
    status: formData.get("status"),
  });

  if (!candidateId.success || !parsedStatus.success) {
    redirect("/dashboard/jobs");
  }

  const candidate = await prisma.candidate.findFirst({
    where: {
      id: candidateId.data,
      job: {
        companyId,
      },
    },
    select: {
      id: true,
      jobId: true,
    },
  });

  if (!candidate) {
    redirect("/dashboard/jobs");
  }

  await prisma.candidate.update({
    where: { id: candidate.id },
    data: {
      status: parsedStatus.data.status,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/candidates/${candidate.id}`);
  revalidatePath(`/dashboard/jobs/${candidate.jobId}/candidates`);
  redirect(`/dashboard/candidates/${candidate.id}`);
}
