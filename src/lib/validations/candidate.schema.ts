import { CandidateStatus } from "@prisma/client";
import { z } from "zod";

import {
  CV_ALLOWED_EXTENSIONS,
  CV_ALLOWED_MIME_TYPES,
  MAX_CV_SIZE_BYTES,
  MAX_CV_SIZE_MB,
  type AllowedCvExtension,
} from "@/lib/storage/storage-provider";

function normalizeOptionalString(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function getFileExtension(file: File): string {
  return file.name.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
}

function hasAllowedCvExtension(file: File): boolean {
  return CV_ALLOWED_EXTENSIONS.includes(getFileExtension(file) as AllowedCvExtension);
}

function hasMatchingCvMimeAndExtension(file: File): boolean {
  const extension = getFileExtension(file);

  if (file.type === "application/pdf") {
    return extension === ".pdf";
  }

  if (
    file.type ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extension === ".docx";
  }

  return false;
}

export const publicJobIdSchema = z
  .string()
  .trim()
  .min(1, "La oferta es obligatoria.")
  .max(100, "La oferta es invalida.")
  .regex(/^[a-zA-Z0-9_-]+$/, "La oferta es invalida.");

export const publicCandidateApplicationSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "El nombre completo es obligatorio.")
    .max(120, "El nombre no puede superar 120 caracteres."),
  email: z
    .string()
    .trim()
    .min(1, "El email es obligatorio.")
    .max(254, "El email no puede superar 254 caracteres.")
    .email("Ingresa un email valido.")
    .transform((email) => email.toLowerCase()),
  phone: z.preprocess(
    normalizeOptionalString,
    z.string().max(30, "El telefono no puede superar 30 caracteres.").optional(),
  ),
  currentPosition: z.preprocess(
    normalizeOptionalString,
    z.string().max(120, "El cargo actual no puede superar 120 caracteres.").optional(),
  ),
  yearsOfExperience: z
    .union([z.number(), z.nan()])
    .optional()
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .pipe(
      z
        .number()
        .int("Los anos de experiencia deben ser un numero entero.")
        .min(0, "Los anos de experiencia no pueden ser negativos.")
        .max(60, "Los anos de experiencia parecen invalidos.")
        .optional(),
    ),
  expectedSalary: z
    .union([z.number(), z.nan()])
    .optional()
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .pipe(
      z
        .number()
        .int("El sueldo esperado debe ser un numero entero.")
        .min(0, "El sueldo esperado no puede ser negativo.")
        .max(999999999, "El sueldo esperado es demasiado alto.")
        .optional(),
    ),
  availability: z.preprocess(
    normalizeOptionalString,
    z.string().max(120, "La disponibilidad no puede superar 120 caracteres.").optional(),
  ),
  cvFile: z
    .instanceof(File, { message: "Debes adjuntar un CV." })
    .refine((file) => file.size > 0, "Debes adjuntar un CV.")
    .refine(
      (file) =>
        CV_ALLOWED_MIME_TYPES.includes(file.type as (typeof CV_ALLOWED_MIME_TYPES)[number]),
      "Solo se permiten archivos PDF o DOCX.",
    )
    .refine(hasAllowedCvExtension, "Solo se permiten archivos PDF o DOCX.")
    .refine(hasMatchingCvMimeAndExtension, "La extension del CV no coincide con su formato.")
    .refine(
      (file) => file.size <= MAX_CV_SIZE_BYTES,
      `El archivo no puede superar ${MAX_CV_SIZE_MB}MB.`,
    ),
});

export const candidateApplySchema = publicCandidateApplicationSchema;

const candidateStatusValues = Object.values(CandidateStatus) as [
  CandidateStatus,
  ...CandidateStatus[],
];

export const candidateIdSchema = z
  .string()
  .min(1, "Candidate id is required")
  .max(100, "Candidate id is invalid");

export const candidateStatusSchema = z.object({
  status: z.enum(candidateStatusValues),
});

export const updateCandidateStatusSchema = z.object({
  candidateId: candidateIdSchema,
  status: z.enum(candidateStatusValues),
});

export const updateCandidateInternalNotesSchema = z.object({
  candidateId: candidateIdSchema,
  internalNotes: z
    .string()
    .trim()
    .max(2000, "Las notas internas no pueden superar 2000 caracteres.")
    .optional(),
});

export const candidateFiltersSchema = z.object({
  status: z.enum(candidateStatusValues).optional(),
  q: z
    .string()
    .trim()
    .max(120, "La busqueda no puede superar 120 caracteres.")
    .optional(),
});

export type CandidateApplyInput = z.infer<typeof publicCandidateApplicationSchema>;
