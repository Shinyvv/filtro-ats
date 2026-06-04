export const CV_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedCvMimeType = (typeof CV_ALLOWED_MIME_TYPES)[number];

export const CV_ALLOWED_EXTENSIONS = [".pdf", ".docx"] as const;

export type AllowedCvExtension = (typeof CV_ALLOWED_EXTENSIONS)[number];

export const MAX_CV_SIZE_MB = 5;
export const MAX_CV_SIZE_BYTES = MAX_CV_SIZE_MB * 1024 * 1024;

export type SaveFileResult = {
  fileName: string;
  filePath: string;
  mimeType: string;
};

export interface StorageProvider {
  validateFile(file: File): { valid: boolean; error?: string };
  saveFile(file: File): Promise<SaveFileResult>;
  deleteFile(filePath: string): Promise<void>;
  getFilePath(filePath: string): string;
}
