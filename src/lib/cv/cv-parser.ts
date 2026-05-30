import { readFile } from "node:fs/promises";

import mammoth from "mammoth";
import pdfParse from "pdf-parse";

type CvParseResult = {
  text: string;
  metadata?: Record<string, unknown>;
};

export async function parseCvFile(options: {
  filePath: string;
  mimeType: string;
}): Promise<CvParseResult> {
  try {
    const fileBuffer = await readFile(options.filePath);

    if (options.mimeType === "application/pdf") {
      const parsed = await pdfParse(fileBuffer);
      return {
        text: parsed.text?.trim() ?? "",
        metadata: {
          pages: parsed.numpages,
          info: parsed.info ?? null,
        },
      };
    }

    if (
      options.mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const parsed = await mammoth.extractRawText({ buffer: fileBuffer });
      return {
        text: parsed.value?.trim() ?? "",
        metadata: {
          warnings: parsed.messages ?? [],
        },
      };
    }

    return {
      text: "",
      metadata: { warning: "Unsupported file type" },
    };
  } catch (error) {
    console.error("cv-parser:error", error);
    return {
      text: "",
      metadata: { error: "CV text extraction failed" },
    };
  }
}
