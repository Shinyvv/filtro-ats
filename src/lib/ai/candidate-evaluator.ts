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

export interface CandidateAiProvider {
  evaluateCandidate(input: CandidateEvaluationInput): Promise<CandidateEvaluationResult>;
}

function getProvider(): CandidateAiProvider {
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY);
  const preferredProvider = process.env.AI_PROVIDER?.toLowerCase() ?? "mock";

  if (preferredProvider === "gemini" && hasGeminiKey) {
    return new GeminiProvider();
  }

  if (preferredProvider !== "mock" && hasGeminiKey) {
    return new GeminiProvider();
  }

  return new MockAiProvider();
}

export async function evaluateCandidate(
  input: CandidateEvaluationInput,
): Promise<CandidateEvaluationResult> {
  const provider = getProvider();

  try {
    const result = await provider.evaluateCandidate(input);
    return {
      ...result,
      score: Math.max(0, Math.min(100, Math.round(result.score))),
    };
  } catch (error) {
    console.error("candidate-evaluator:error", error);
    const fallbackProvider = new MockAiProvider();
    return fallbackProvider.evaluateCandidate(input);
  }
}
