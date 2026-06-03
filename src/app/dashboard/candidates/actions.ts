"use server";

import type { CandidateStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";

import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";
import {
  updateCandidateInternalNotesSchema,
  updateCandidateStatusSchema,
} from "@/lib/validations/candidate.schema";

type CandidateActionResult =
  | { ok: true; message: string }
  | { ok: false; error: string };

type CandidateForCompany = {
  id: string;
  jobId: string;
  job: {
    companyId: string;
  };
};

async function getCandidateForCompanyOrThrow(
  candidateId: string,
  companyId: string,
): Promise<CandidateForCompany> {
  const candidate = await prisma.candidate.findUnique({
    where: { id: candidateId },
    select: {
      id: true,
      jobId: true,
      job: {
        select: {
          companyId: true,
        },
      },
    },
  });

  if (!candidate || candidate.job.companyId !== companyId) {
    throw new Error("candidate_not_found");
  }

  return candidate;
}

export async function updateCandidateStatusAction(input: {
  candidateId: string;
  status: CandidateStatus;
}): Promise<CandidateActionResult> {
  try {
    const parsed = updateCandidateStatusSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Datos inválidos para actualizar el estado." };
    }

    const user = await requireUser();
    const companyId = await getCompanyIdForUser(user);
    const candidate = await getCandidateForCompanyOrThrow(parsed.data.candidateId, companyId);

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        status: parsed.data.status,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/jobs");
    revalidatePath(`/dashboard/jobs/${candidate.jobId}`);
    revalidatePath(`/dashboard/jobs/${candidate.jobId}/candidates`);
    revalidatePath(`/dashboard/candidates/${candidate.id}`);

    return { ok: true, message: "Estado actualizado correctamente" };
  } catch (error) {
    console.error("update-candidate-status:error", error);
    return { ok: false, error: "No se pudo actualizar el estado del candidato." };
  }
}

export async function updateCandidateInternalNotesAction(input: {
  candidateId: string;
  internalNotes: string;
}): Promise<CandidateActionResult> {
  try {
    const parsed = updateCandidateInternalNotesSchema.safeParse(input);
    if (!parsed.success) {
      return { ok: false, error: "Datos inválidos para actualizar las notas." };
    }

    const user = await requireUser();
    const companyId = await getCompanyIdForUser(user);
    const candidate = await getCandidateForCompanyOrThrow(parsed.data.candidateId, companyId);

    await prisma.candidate.update({
      where: { id: candidate.id },
      data: {
        internalNotes: parsed.data.internalNotes ?? "",
      },
    });

    revalidatePath(`/dashboard/candidates/${candidate.id}`);
    revalidatePath(`/dashboard/jobs/${candidate.jobId}/candidates`);

    return { ok: true, message: "Notas internas actualizadas correctamente" };
  } catch (error) {
    console.error("update-candidate-notes:error", error);
    return { ok: false, error: "No se pudieron actualizar las notas internas." };
  }
}
