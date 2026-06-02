import { notFound } from "next/navigation";

import { JobForm } from "@/components/jobs/job-form";
import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";

import { updateJobAction } from "../actions";

export const dynamic = "force-dynamic";

type EditJobPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function EditJobPage({ params }: EditJobPageProps) {
  const resolvedParams = await params;
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const job = await prisma.job.findFirst({
    where: { id: resolvedParams.id, companyId },
  });

  if (!job) {
    notFound();
  }

  const action = updateJobAction.bind(null, job.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Editar oferta</h1>
        <p className="text-zinc-600">Actualiza la informacion de la vacante.</p>
      </div>
      <JobForm
        title={`Editar: ${job.title}`}
        description="Modifica descripcion, requisitos y estado."
        submitLabel="Guardar cambios"
        action={action}
        defaultValues={{
          title: job.title,
          description: job.description,
          requirements: job.requirements,
          location: job.location,
          modality: job.modality,
          contractType: job.contractType,
          status: job.status,
        }}
      />
    </div>
  );
}

