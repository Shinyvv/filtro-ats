/**
 * Rate limiter simple en memoria (fixed window).
 *
 * IMPORTANTE (MVP/demo):
 * - Funciona solo dentro de un proceso. En serverless o multi-instancia NO es
 *   confiable porque el estado no se comparte entre instancias.
 * - Para produccion real, reemplazar por Redis/Upstash manteniendo esta misma
 *   interfaz (checkRateLimit).
 */

import {
  RL_GLOBAL_IP_LIMIT,
  RL_GLOBAL_IP_WINDOW_MS,
  RL_PER_JOB_LIMIT,
  RL_PER_JOB_WINDOW_MS,
} from "@/lib/ai/ai-limits";

type WindowEntry = {
  count: number;
  resetAt: number;
};

const globalForRl = globalThis as unknown as {
  __atsRateLimitStore?: Map<string, WindowEntry>;
};

const store: Map<string, WindowEntry> =
  globalForRl.__atsRateLimitStore ?? new Map<string, WindowEntry>();

if (process.env.NODE_ENV !== "production") {
  globalForRl.__atsRateLimitStore = store;
}

function hit(key: string, limit: number, windowMs: number): {
  allowed: boolean;
  retryAfterSeconds: number;
} {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (entry.count >= limit) {
    return {
      allowed: false,
      retryAfterSeconds: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
    };
  }

  entry.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
  reason?: "per_job" | "global_ip";
};

/**
 * Verifica los dos limites (por IP+jobId y por IP global).
 * Consume un "hit" en ambos buckets solo si los dos permiten.
 */
export function checkApplyRateLimit(ip: string, jobId: string): RateLimitResult {
  const safeIp = ip || "unknown";

  const globalKey = `apply:ip:${safeIp}`;
  const jobKey = `apply:ip:${safeIp}:job:${jobId}`;

  // Evaluamos sin consumir primero para no "gastar" un bucket si el otro ya bloquea.
  const now = Date.now();

  const peek = (key: string, limit: number) => {
    const entry = store.get(key);
    if (!entry || entry.resetAt <= now) return { blocked: false, retryAfter: 0 };
    if (entry.count >= limit) {
      return {
        blocked: true,
        retryAfter: Math.max(1, Math.ceil((entry.resetAt - now) / 1000)),
      };
    }
    return { blocked: false, retryAfter: 0 };
  };

  const globalPeek = peek(globalKey, RL_GLOBAL_IP_LIMIT);
  if (globalPeek.blocked) {
    return {
      allowed: false,
      retryAfterSeconds: globalPeek.retryAfter,
      reason: "global_ip",
    };
  }

  const jobPeek = peek(jobKey, RL_PER_JOB_LIMIT);
  if (jobPeek.blocked) {
    return {
      allowed: false,
      retryAfterSeconds: jobPeek.retryAfter,
      reason: "per_job",
    };
  }

  // Ambos permiten -> consumir hit en los dos.
  hit(globalKey, RL_GLOBAL_IP_LIMIT, RL_GLOBAL_IP_WINDOW_MS);
  hit(jobKey, RL_PER_JOB_LIMIT, RL_PER_JOB_WINDOW_MS);

  return { allowed: true, retryAfterSeconds: 0 };
}
