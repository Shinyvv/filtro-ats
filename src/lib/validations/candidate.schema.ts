import { CandidateStatus } from "@prisma/client";
import { z } from "zod";

const allowedMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
] as const;

export const MAX_CV_SIZE_BYTES = 5 * 1024 * 1024;

export const candidateApplySchema = z.object({
  fullName: z
    .string()
    .min(2, "El nombre completo es obligatorio.")
    .max(120, "El nombre no puede superar 120 caracteres."),
  email: z.string().email("Ingresa un email válido."),
  phone: z
    .string()
    .min(6, "El teléfono es obligatorio.")
    .max(30, "El teléfono no puede superar 30 caracteres."),
  currentPosition: z
    .string()
    .min(2, "El cargo actual es obligatorio.")
    .max(120, "El cargo actual no puede superar 120 caracteres."),
  yearsOfExperience: z
    .union([z.number(), z.nan()])
    .optional()
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .pipe(
      z
        .number()
        .int("Los años de experiencia deben ser un número entero.")
        .min(0, "Los años de experiencia no pueden ser negativos.")
        .max(60, "Los años de experiencia parecen inválidos.")
        .optional(),
    ),
  expectedSalary: z
    .union([z.number(), z.nan()])
    .optional()
    .transform((value) => (Number.isNaN(value) ? undefined : value))
    .pipe(
      z
        .number()
        .int("El sueldo esperado debe ser un número entero.")
        .min(0, "El sueldo esperado no puede ser negativo.")
        .max(999999999, "El sueldo esperado es demasiado alto.")
        .optional(),
    ),
  availability: z
    .string()
    .max(120, "La disponibilidad no puede superar 120 caracteres.")
    .optional(),
  cvFile: z
    .instanceof(File, { message: "Debes adjuntar un CV." })
    .refine((file) => file.size > 0, "Debes adjuntar un CV.")
    .refine(
      (file) => allowedMimeTypes.includes(file.type as (typeof allowedMimeTypes)[number]),
      "Solo se permiten archivos PDF o DOCX.",
    )
    .refine(
      (file) => file.size <= MAX_CV_SIZE_BYTES,
      `El archivo no puede superar ${MAX_CV_SIZE_BYTES / (1024 * 1024)}MB.`,
    ),
});

const candidateStatusValues = Object.values(CandidateStatus) as [
  CandidateStatus,
  ...CandidateStatus[],
];

export const candidateStatusSchema = z.object({
  status: z.enum(candidateStatusValues),
});

export type CandidateApplyInput = z.infer<typeof candidateApplySchema>;
