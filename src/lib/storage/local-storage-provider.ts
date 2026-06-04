import { randomUUID } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  CV_ALLOWED_EXTENSIONS,
  CV_ALLOWED_MIME_TYPES,
  MAX_CV_SIZE_BYTES,
  MAX_CV_SIZE_MB,
  type AllowedCvExtension,
  type SaveFileResult,
  type StorageProvider,
} from "./storage-provider";

const MIME_TO_EXTENSION = {
  "application/pdf": ".pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
} as const;

function getFileExtension(fileName: string): string {
  return path.extname(fileName).toLowerCase();
}

function isPathInside(basePath: string, targetPath: string): boolean {
  const relativePath = path.relative(basePath, targetPath);
  return Boolean(relativePath) && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

export class LocalStorageProvider implements StorageProvider {
  private readonly uploadDir: string;

  constructor(uploadDir = path.join(process.cwd(), "uploads", "cvs")) {
    this.uploadDir = path.resolve(uploadDir);
  }

  validateFile(file: File): { valid: boolean; error?: string } {
    if (!file || file.size === 0) {
      return { valid: false, error: "Debes adjuntar un CV." };
    }

    if (file.size > MAX_CV_SIZE_BYTES) {
      return { valid: false, error: `El archivo supera el limite de ${MAX_CV_SIZE_MB}MB.` };
    }

    if (!CV_ALLOWED_MIME_TYPES.includes(file.type as (typeof CV_ALLOWED_MIME_TYPES)[number])) {
      return { valid: false, error: "Solo se permiten archivos PDF o DOCX." };
    }

    const expectedExtension = MIME_TO_EXTENSION[file.type as keyof typeof MIME_TO_EXTENSION];
    const receivedExtension = getFileExtension(file.name);

    if (!CV_ALLOWED_EXTENSIONS.includes(receivedExtension as AllowedCvExtension)) {
      return { valid: false, error: "Solo se permiten archivos PDF o DOCX." };
    }

    if (!expectedExtension || receivedExtension !== expectedExtension) {
      return { valid: false, error: "La extension del CV no coincide con su formato." };
    }

    return { valid: true };
  }

  async saveFile(file: File): Promise<SaveFileResult> {
    const validation = this.validateFile(file);
    if (!validation.valid) {
      throw new Error(validation.error ?? "Invalid file");
    }

    await mkdir(this.uploadDir, { recursive: true });

    const extension = MIME_TO_EXTENSION[file.type as keyof typeof MIME_TO_EXTENSION];
    const fileName = `${randomUUID()}${extension}`;
    const absolutePath = path.resolve(this.uploadDir, fileName);

    if (!isPathInside(this.uploadDir, absolutePath)) {
      throw new Error("Invalid upload path");
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(absolutePath, buffer, { flag: "wx" });

    return {
      fileName,
      filePath: absolutePath,
      mimeType: file.type,
    };
  }

  async deleteFile(filePath: string): Promise<void> {
    const resolvedPath = path.resolve(filePath);

    if (!isPathInside(this.uploadDir, resolvedPath)) {
      return;
    }

    try {
      await unlink(resolvedPath);
    } catch (error) {
      if (error instanceof Error && "code" in error && error.code === "ENOENT") {
        return;
      }

      throw error;
    }
  }

  getFilePath(filePath: string): string {
    return path.resolve(filePath);
  }
}

export const localStorageProvider = new LocalStorageProvider();
