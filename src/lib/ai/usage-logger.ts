import { Prisma } from "@prisma/client";

import { prisma } from "@/lib/prisma/prisma";
import type { AiUsageStatus } from "@/lib/ai/ai-limits";

export type AiUsageLogInput = {
  userId?: string | null;
  companyId?: string | null;
  jobId?: string | null;
  candidateId?: string | null;
  ip?: string | null;
  model: string;
  action: string;
  inputChars: number;
  outputChars: number;
  cvWasTruncated: boolean;
  status: AiUsageStatus;
  errorMessage?: string | null;
};

/**
 * Registra un intento de uso de IA. Nunca debe romper el flujo de postulacion:
 * si el log falla, se traga el error y se loguea en consola.
 */
export async function logAiUsage(input: AiUsageLogInput): Promise<void> {
  try {
    await prisma.aiUsageLog.create({
      data: {
        userId: input.userId ?? null,
        companyId: input.companyId ?? null,
        jobId: input.jobId ?? null,
        candidateId: input.candidateId ?? null,
        ip: input.ip ?? null,
        model: input.model,
        action: input.action,
        inputChars: input.inputChars,
        outputChars: input.outputChars,
        cvWasTruncated: input.cvWasTruncated,
        status: input.status,
        errorMessage: input.errorMessage ?? null,
      },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("ai-usage-logger:prisma-error", error.code, error.message);
    } else {
      console.error("ai-usage-logger:error", error);
    }
  }
}
