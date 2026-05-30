import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

import {
  CV_ALLOWED_MIME_TYPES,
  MAX_CV_SIZE_BYTES,
  type SaveFileResult,
  type StorageProvider,
} from "./storage-provider";

export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;

  constructor(uploadDir = path.join(process.cwd(), "uploads", "cvs")) {
    this.uploadDir = uploadDir;
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file || file.size === 0) {
      return { valid: false, error: "Debes adjuntar un CV." };
    }

    if (!CV_ALLOWED_MIME_TYPES.includes(file.type as (typeof CV_ALLOWED_MIME_TYPES)[number])) {
      return { valid: false, error: "Solo se permiten archivos PDF o DOCX." };
    }

    if (file.size > MAX_CV_SIZE_BYTES) {
      return { valid: false, error: "El archivo supera el limite de 5MB." };
    }

    return { valid: true };
  }

  async saveFile(file: File): Promise<SaveFileResult> {
    await mkdir(this.uploadDir, { recursive: true });

    const extension = file.type === "application/pdf" ? "pdf" : "docx";
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const fileName = `${Date.now()}_${randomUUID()}_${safeName || `cv.${extension}`}`;
    const absolutePath = path.join(this.uploadDir, fileName);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer);

    return {
      fileName,
      filePath: absolutePath,
      mimeType: file.type,
    };
  }

  getFilePath(filePath: string): string {
    return path.resolve(filePath);
  }
}

export const localStorageProvider = new LocalStorageProvider();
