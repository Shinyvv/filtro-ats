"use server";

import { redirect } from "next/navigation";

import { clearUserSession } from "@/lib/auth/auth";

export async function logoutAction(): Promise<never> {
  await clearUserSession();
  redirect("/login");
}
