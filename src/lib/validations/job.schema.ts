import { JobStatus } from "@prisma/client";
import { z } from "zod";

const jobStatusValues = Object.values(JobStatus) as [JobStatus, ...JobStatus[]];

export const jobSchema = z.object({
  title: z
    .string()
    .trim()
    .min(3, "El titulo debe tener al menos 3 caracteres.")
    .max(120, "El titulo no puede superar 120 caracteres."),
  description: z
    .string()
    .trim()
    .min(20, "La descripcion debe tener al menos 20 caracteres.")
    .max(5000, "La descripcion no puede superar 5000 caracteres."),
  requirements: z
    .string()
    .trim()
    .min(10, "Los requisitos deben tener al menos 10 caracteres.")
    .max(5000, "Los requisitos no pueden superar 5000 caracteres."),
  location: z
    .string()
    .trim()
    .min(2, "La ubicacion es obligatoria.")
    .max(120, "La ubicacion no puede superar 120 caracteres."),
  modality: z
    .string()
    .trim()
    .min(2, "La modalidad es obligatoria.")
    .max(80, "La modalidad no puede superar 80 caracteres."),
  contractType: z
    .string()
    .trim()
    .min(2, "El tipo de contrato es obligatorio.")
    .max(80, "El tipo de contrato no puede superar 80 caracteres."),
  status: z.enum(jobStatusValues),
});

export type JobInput = z.infer<typeof jobSchema>;
