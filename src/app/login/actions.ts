"use server";

import { redirect } from "next/navigation";

import { createUserSession } from "@/lib/auth/auth";
import { verifyPassword } from "@/lib/auth/password";
import { prisma } from "@/lib/prisma/prisma";
import { loginSchema } from "@/lib/validations/auth.schema";

function getErrorCodeFromValidationError(): string {
  return "validation";
}

export async function loginAction(formData: FormData): Promise<never> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    redirect(`/login?error=${getErrorCodeFromValidationError()}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: parsed.data.email.toLowerCase() },
  });

  if (!user) {
    redirect("/login?error=credentials");
  }

  const passwordMatches = await verifyPassword(parsed.data.password, user.passwordHash);
  if (!passwordMatches) {
    redirect("/login?error=credentials");
  }

  await createUserSession(user.id);
  redirect("/dashboard");
}
