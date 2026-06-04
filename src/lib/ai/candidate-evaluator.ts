import { GeminiProvider } from "./providers/gemini-provider";
import { MockAiProvider } from "./providers/mock-ai-provider";
import { OpenRouterProvider } from "./providers/openrouter-provider";
import { OPENROUTER_DEFAULT_MODEL } from "./ai-limits";
import {
  getCachedEvaluation,
  getEvaluationCacheKey,
  setCachedEvaluation,
} from "@/lib/ai/evaluation-cache";
import { logAiDebug, logAiError } from "@/lib/ai/ai-debug-logger";

export type CandidateEvaluationInput = {
  jobTitle: string;
  jobDescription: string;
  jobRequirements: string;
  candidateCvText: string;
  candidateFormData: {
    fullName: string;
    currentPosition: string;
    yearsOfExperience?: number;
    expectedSalary?: number;
    availability?: string;
  };
};

export type CandidateEvaluationResult = {
  score: number;
  summary: string;
  strengths: string[];
  risks: string[];
  recommendation: "SHORTLIST" | "REVIEW" | "REJECT";
};

/**
 * Resultado enriquecido con metadatos de ejecucion para el registro de uso.
 * `status` indica si la respuesta vino del proveedor real (success), de un
 * error controlado o del fallback mock.
 */
export type CandidateEvaluationOutcome = CandidateEvaluationResult & {
  status: "success" | "error" | "fallback";
  model: string;
  outputChars: number;
  errorMessage?: string;
};

export interface CandidateAiProvider {
  evaluateCandidate(input: CandidateEvaluationInput): Promise<CandidateEvaluationResult>;
}

function getProvider(): { provider: CandidateAiProvider; model: string } {
  const preferredProvider = process.env.AI_PROVIDER?.toLowerCase() ?? "mock";

  if (preferredProvider === "openrouter") {
    if (!process.env.OPENROUTER_API_KEY) {
      return { provider: new MockAiProvider(), model: "mock" };
    }

    return {
      provider: new OpenRouterProvider(),
      model: process.env.OPENROUTER_MODEL ?? OPENROUTER_DEFAULT_MODEL,
    };
  }

  if (preferredProvider === "gemini") {
    if (!process.env.GEMINI_API_KEY) {
      return { provider: new MockAiProvider(), model: "mock" };
    }

    return { provider: new GeminiProvider(), model: "gemini-2.5-flash-lite" };
  }

  return { provider: new MockAiProvider(), model: "mock" };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function getProviderName(model: string, usingMock: boolean): string {
  if (usingMock) {
    return "mock";
  }

  if (model.includes("gemini")) {
    return "gemini";
  }

  return "openrouter";
}

export async function evaluateCandidate(
  input: CandidateEvaluationInput,
): Promise<CandidateEvaluationOutcome> {
  const { provider, model } = getProvider();
  const usingMock = model === "mock";
  const cacheKey = getEvaluationCacheKey(input, model);
  const preferredProvider = process.env.AI_PROVIDER?.toLowerCase() ?? "mock";

  logAiDebug("candidate-evaluator:provider-selected", {
    preferredProvider,
    selectedModel: model,
    usingMock,
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    hasOpenRouterKey: Boolean(process.env.OPENROUTER_API_KEY),
  });

  logAiDebug("candidate-evaluator:cache-check", {
    model,
    usingMock,
    cvChars: input.candidateCvText.length,
    jobTitleChars: input.jobTitle.length,
    jobDescriptionChars: input.jobDescription.length,
    jobRequirementsChars: input.jobRequirements.length,
  });

  const cached = getCachedEvaluation(cacheKey);

  if (cached) {
    logAiDebug("candidate-evaluator:cache-hit", {
      model,
      returnedModel: `${model}:cache`,
    });

    return {
      ...cached,
      score: clampScore(cached.score),
      status: usingMock ? "fallback" : "success",
      model: `${model}:cache`,
      outputChars: (cached.summary ?? "").length,
    };
  }

  logAiDebug("candidate-evaluator:cache-miss", {
    model,
  });

  const startedAt = Date.now();

  try {
    logAiDebug("candidate-evaluator:provider-call-start", {
      model,
      provider: getProviderName(model, usingMock),
    });

    const result = await provider.evaluateCandidate(input);
    const score = clampScore(result.score);
    const normalizedResult = {
      ...result,
      score,
    };

    logAiDebug("candidate-evaluator:provider-call-success", {
      model,
      durationMs: Date.now() - startedAt,
      score,
      recommendation: normalizedResult.recommendation,
      summaryChars: normalizedResult.summary.length,
      strengthsCount: normalizedResult.strengths.length,
      risksCount: normalizedResult.risks.length,
    });

    setCachedEvaluation(cacheKey, normalizedResult);

    return {
      ...normalizedResult,
      status: usingMock ? "fallback" : "success",
      model,
      outputChars: (normalizedResult.summary ?? "").length,
    };
  } catch (error) {
    logAiError("candidate-evaluator:provider-call-error", error, {
      model,
      durationMs: Date.now() - startedAt,
      fallbackProvider: "mock",
    });
    // Fallback seguro: nunca reintenta el proveedor real aqui (el retry vive
    // dentro del GeminiProvider). Solo degradamos al mock una vez.
    const fallback = await new MockAiProvider().evaluateCandidate(input);
    const fallbackScore = clampScore(fallback.score);

    logAiDebug("candidate-evaluator:fallback-mock-success", {
      originalModel: model,
      fallbackScore,
      fallbackRecommendation: fallback.recommendation,
    });

    return {
      ...fallback,
      score: fallbackScore,
      status: "error",
      model,
      outputChars: (fallback.summary ?? "").length,
      errorMessage: error instanceof Error ? error.message : "unknown error",
    };
  }
}
