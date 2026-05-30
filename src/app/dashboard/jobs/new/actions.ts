"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";
import { jobSchema } from "@/lib/validations/job.schema";

export async function createJobAction(formData: FormData): Promise<never> {
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const parsed = jobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    requirements: formData.get("requirements"),
    location: formData.get("location"),
    modality: formData.get("modality"),
    contractType: formData.get("contractType"),
    status: formData.get("status"),
  });

  if (!parsed.success) {
    redirect("/dashboard/jobs/new?error=validation");
  }

  const job = await prisma.job.create({
    data: {
      companyId,
      ...parsed.data,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/jobs");
  redirect(`/dashboard/jobs/${job.id}`);
}
