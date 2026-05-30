import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Ingresa un email valido."),
  password: z
    .string()
    .min(6, "La contrasena debe tener al menos 6 caracteres.")
    .max(128, "La contrasena es demasiado larga."),
});

export type LoginInput = z.infer<typeof loginSchema>;
