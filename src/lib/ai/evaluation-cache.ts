import { createHash } from "node:crypto";

import type {
  CandidateEvaluationInput,
  CandidateEvaluationResult,
} from "@/lib/ai/candidate-evaluator";
import { logAiDebug } from "@/lib/ai/ai-debug-logger";

type CacheEntry = {
  result: CandidateEvaluationResult;
  expiresAt: number;
};

const globalForAiCache = globalThis as unknown as {
  __atsAiEvaluationCache?: Map<string, CacheEntry>;
};

const cache =
  globalForAiCache.__atsAiEvaluationCache ?? new Map<string, CacheEntry>();

globalForAiCache.__atsAiEvaluationCache = cache;

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const PROMPT_VERSION = "ats-v2-calibrated";

function sha256(value: string): string {
  return createHash("sha256").update(value).digest("hex");
}

function normalizeForCache(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

export function getEvaluationCacheKey(
  input: CandidateEvaluationInput,
  model: string,
): string {
  return sha256(
    JSON.stringify({
      promptVersion: PROMPT_VERSION,
      model,
      jobTitle: input.jobTitle,
      jobDescription: input.jobDescription,
      jobRequirements: input.jobRequirements,
      candidateCvTextHash: sha256(normalizeForCache(input.candidateCvText)),
      currentPosition: input.candidateFormData.currentPosition,
      yearsOfExperience: input.candidateFormData.yearsOfExperience,
      availability: input.candidateFormData.availability,
    }),
  );
}

export function getCachedEvaluation(
  key: string,
): CandidateEvaluationResult | null {
  const entry = cache.get(key);
  const cacheKeyPrefix = key.slice(0, 10);

  if (!entry) {
    logAiDebug("ai-cache:miss", {
      reason: "not_found",
      cacheKeyPrefix,
    });
    return null;
  }

  if (entry.expiresAt <= Date.now()) {
    cache.delete(key);
    logAiDebug("ai-cache:miss", {
      reason: "expired",
      cacheKeyPrefix,
    });
    return null;
  }

  logAiDebug("ai-cache:hit", {
    cacheKeyPrefix,
    expiresInMs: entry.expiresAt - Date.now(),
  });

  return entry.result;
}

export function setCachedEvaluation(
  key: string,
  result: CandidateEvaluationResult,
): void {
  cache.set(key, {
    result,
    expiresAt: Date.now() + CACHE_TTL_MS,
  });

  logAiDebug("ai-cache:set", {
    cacheKeyPrefix: key.slice(0, 10),
    ttlMs: CACHE_TTL_MS,
    cacheSize: cache.size,
  });
}

export function getEvaluationCacheSize(): number {
  return cache.size;
}
