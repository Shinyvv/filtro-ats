"use server";

import { redirect } from "next/navigation";

import { updateCandidateStatusAction as updateCandidateStatus } from "@/app/dashboard/candidates/actions";
import { updateCandidateStatusSchema } from "@/lib/validations/candidate.schema";

export async function updateCandidateStatusAction(formData: FormData): Promise<void> {
  const parsed = updateCandidateStatusSchema.safeParse({
    candidateId: formData.get("candidateId"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect("/dashboard/jobs");
  }

  const result = await updateCandidateStatus(parsed.data);

  if (!result.ok) {
    redirect("/dashboard/jobs");
  }

  redirect(`/dashboard/candidates/${parsed.data.candidateId}`);
}
