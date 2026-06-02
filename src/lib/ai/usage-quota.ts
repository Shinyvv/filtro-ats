import { prisma } from "@/lib/prisma/prisma";
import {
  QUOTA_GLOBAL_PER_DAY,
  QUOTA_PER_JOB_PER_DAY,
} from "@/lib/ai/ai-limits";

export type QuotaResult = {
  allowed: boolean;
  reason?: "per_job" | "global";
};

function startOfTodayUtc(): Date {
  const now = new Date();
  return new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
  );
}

/**
 * Verifica la cuota diaria de analisis IA antes de llamar a Gemini.
 * Cuenta solo intentos que llegaron al modelo (success/error/fallback se
 * registran todos, pero aqui contamos cualquier registro del dia como consumo).
 */
export async function checkAiDailyQuota(jobId: string): Promise<QuotaResult> {
  const since = startOfTodayUtc();

  const [globalCount, jobCount] = await Promise.all([
    prisma.aiUsageLog.count({
      where: { createdAt: { gte: since } },
    }),
    prisma.aiUsageLog.count({
      where: { createdAt: { gte: since }, jobId },
    }),
  ]);

  if (globalCount >= QUOTA_GLOBAL_PER_DAY) {
    return { allowed: false, reason: "global" };
  }

  if (jobCount >= QUOTA_PER_JOB_PER_DAY) {
    return { allowed: false, reason: "per_job" };
  }

  return { allowed: true };
}
