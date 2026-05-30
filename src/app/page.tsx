import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth/auth";

export default async function HomePage(): Promise<never> {
  const user = await getCurrentUser();
  redirect(user ? "/dashboard" : "/login");
}
