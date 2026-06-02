import { MAX_CV_TEXT_CHARS } from "@/lib/ai/ai-limits";

export type NormalizedCvText = {
  text: string;
  wasTruncated: boolean;
  originalChars: number;
  finalChars: number;
};

/**
 * Normaliza y recorta de forma segura el texto del CV antes de enviarlo al LLM.
 * - colapsa espacios y tabs repetidos
 * - colapsa saltos de linea repetidos (max 2 seguidos)
 * - trim general
 * - recorta a MAX_CV_TEXT_CHARS si excede
 */
export function normalizeCvText(
  raw: string,
  maxChars: number = MAX_CV_TEXT_CHARS,
): NormalizedCvText {
  const cleaned = (raw ?? "")
    .replace(/\r\n/g, "\n")
    .replace(/[\t\f\v ]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  const originalChars = cleaned.length;

  if (originalChars <= maxChars) {
    return {
      text: cleaned,
      wasTruncated: false,
      originalChars,
      finalChars: originalChars,
    };
  }

  const truncated = cleaned.slice(0, maxChars).trim();

  return {
    text: truncated,
    wasTruncated: true,
    originalChars,
    finalChars: truncated.length,
  };
}
