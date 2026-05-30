import { z } from "zod";

import type {
  CandidateAiProvider,
  CandidateEvaluationInput,
  CandidateEvaluationResult,
} from "@/lib/ai/candidate-evaluator";

const geminiResponseSchema = z.object({
  score: z.number().min(0).max(100),
  summary: z.string().min(1),
  strengths: z.array(z.string()).default([]),
  risks: z.array(z.string()).default([]),
  recommendation: z.enum(["SHORTLIST", "REVIEW", "REJECT"]),
});

function stripCodeFences(value: string): string {
  return value
    .trim()
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/\s*```$/i, "");
}

function buildPrompt(input: CandidateEvaluationInput): string {
  return [
    "Analiza el siguiente postulante para la oferta indicada.",
    "Devuelve exclusivamente JSON valido.",
    "",
    "Formato esperado:",
    "{",
    '  "score": number,',
    '  "summary": string,',
    '  "strengths": string[],',
    '  "risks": string[],',
    '  "recommendation": "SHORTLIST" | "REVIEW" | "REJECT"',
    "}",
    "",
    "Oferta:",
    `Titulo: ${input.jobTitle}`,
    `Descripcion: ${input.jobDescription}`,
    `Requisitos: ${input.jobRequirements}`,
    "",
    "Postulante:",
    `Nombre: ${input.candidateFormData.fullName}`,
    `Cargo actual: ${input.candidateFormData.currentPosition}`,
    `Anos de experiencia: ${input.candidateFormData.yearsOfExperience ?? "N/A"}`,
    `Texto CV: ${input.candidateCvText || "Sin texto extraido"}`,
  ].join("\n");
}

export class GeminiProvider implements CandidateAiProvider {
  async evaluateCandidate(
    input: CandidateEvaluationInput,
  ): Promise<CandidateEvaluationResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not configured");
    }

    const model = "gemini-2.5-flash-lite";
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: buildPrompt(input) }],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Gemini request failed: ${response.status} ${errorBody}`);
    }

    const data = (await response.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };

    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini returned an empty response");
    }

    const parsed = geminiResponseSchema.parse(JSON.parse(stripCodeFences(rawText)));

    return {
      score: Math.round(parsed.score),
      summary: parsed.summary,
      strengths: parsed.strengths,
      risks: parsed.risks,
      recommendation: parsed.recommendation,
    };
  }
}
