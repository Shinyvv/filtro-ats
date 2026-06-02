import { GeminiProvider } from "./providers/gemini-provider";
import { MockAiProvider } from "./providers/mock-ai-provider";

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
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const preferredProvider = process.env.AI_PROVIDER?.toLowerCase() ?? "mock";

  if (preferredProvider !== "mock" && hasGeminiKey) {
    return { provider: new GeminiProvider(), model: "gemini-2.5-flash-lite" };
  }

  return { provider: new MockAiProvider(), model: "mock" };
}

function clampScore(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function evaluateCandidate(
  input: CandidateEvaluationInput,
): Promise<CandidateEvaluationOutcome> {
  const { provider, model } = getProvider();
  const usingMock = model === "mock";

  try {
    const result = await provider.evaluateCandidate(input);
    const score = clampScore(result.score);
    return {
      ...result,
      score,
      status: usingMock ? "fallback" : "success",
      model,
      outputChars: (result.summary ?? "").length,
    };
  } catch (error) {
    console.error("candidate-evaluator:error", error);
    // Fallback seguro: nunca reintenta el proveedor real aqui (el retry vive
    // dentro del GeminiProvider). Solo degradamos al mock una vez.
    const fallback = await new MockAiProvider().evaluateCandidate(input);
    return {
      ...fallback,
      score: clampScore(fallback.score),
      status: "error",
      model,
      outputChars: (fallback.summary ?? "").length,
      errorMessage: error instanceof Error ? error.message : "unknown error",
    };
  }
}
