export const CV_ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export type AllowedCvMimeType = (typeof CV_ALLOWED_MIME_TYPES)[number];

export const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;

export type SaveFileResult = {
  fileName: string;
  filePath: string;
  mimeType: string;
};

export interface StorageProvider {
  validateFile(file: File): { valid: boolean; error?: string };
  saveFile(file: File): Promise<SaveFileResult>;
  getFilePath(filePath: string): string;
}
