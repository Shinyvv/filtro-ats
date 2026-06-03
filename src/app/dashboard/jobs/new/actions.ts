"use server";

import { JobStatus } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";
import { jobSchema } from "@/lib/validations/job.schema";

function getText(formData: FormData, key: string): string {
  const value = formData.get(key);

  if (typeof value !== "string") {
    return "";
  }

  return value.trim();
}

export async function createJobAction(formData: FormData): Promise<never> {
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const rawData = {
    title: getText(formData, "title"),
    description: getText(formData, "description"),
    requirements: getText(formData, "requirements"),
    location: getText(formData, "location"),
    modality: getText(formData, "modality"),
    contractType: getText(formData, "contractType"),
    status: getText(formData, "status") || JobStatus.DRAFT,
  };

  console.log("CREATE JOB FORM DATA:", Object.fromEntries(formData.entries()));
  console.log("CREATE JOB RAW DATA:", rawData);

  const parsed = jobSchema.safeParse(rawData);

  if (!parsed.success) {
    console.error("CREATE JOB VALIDATION ERROR:", parsed.error.flatten());
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
