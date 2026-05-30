import type {
  CandidateAiProvider,
  CandidateEvaluationInput,
  CandidateEvaluationResult,
} from "@/lib/ai/candidate-evaluator";

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s]/gi, " ");
}

function getRequirementKeywords(requirements: string): string[] {
  const stopWords = new Set([
    "para",
    "con",
    "como",
    "esta",
    "este",
    "desde",
    "hasta",
    "sobre",
    "entre",
    "debe",
    "deben",
    "tener",
    "experiencia",
    "manejo",
  ]);

  return Array.from(
    new Set(
      normalize(requirements)
        .split(/\s+/)
        .filter((word) => word.length >= 4 && !stopWords.has(word)),
    ),
  ).slice(0, 12);
}

function clampScore(value: number): number {
  if (value < 0) {
    return 0;
  }

  if (value > 100) {
    return 100;
  }

  return Math.round(value);
}

export class MockAiProvider implements CandidateAiProvider {
  async evaluateCandidate(
    input: CandidateEvaluationInput,
  ): Promise<CandidateEvaluationResult> {
    const cvText = normalize(input.candidateCvText);
    const keywords = getRequirementKeywords(input.jobRequirements);

    const matches = keywords.filter((keyword) => cvText.includes(keyword));
    const missing = keywords.filter((keyword) => !cvText.includes(keyword));

    const keywordRatio = keywords.length ? matches.length / keywords.length : 0;
    const years = input.candidateFormData.yearsOfExperience ?? 0;

    const rawScore = 35 + keywordRatio * 50 + Math.min(years, 10) * 1.5;
    const score = clampScore(rawScore);

    const recommendation =
      score >= 75 ? "SHORTLIST" : score >= 50 ? "REVIEW" : "REJECT";

    const risks =
      missing.length > 0
        ? missing.slice(0, 4).map((risk) => `No se detecta ${risk} en el CV`)
        : ["No se detectan brechas criticas en esta revision inicial."];

    return {
      score,
      summary: `Coincidencias clave: ${matches.length}/${keywords.length}. Puntaje estimado por analisis inicial automatizado.`,
      strengths: matches.slice(0, 4).map((match) => `Menciona ${match}`),
      risks,
      recommendation,
    };
  }
}
