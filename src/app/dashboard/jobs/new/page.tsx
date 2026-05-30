import { JobForm } from "@/components/jobs/job-form";

import { createJobAction } from "./actions";

export default async function NewJobPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold text-zinc-900">Nueva oferta</h1>
        <p className="text-zinc-600">Define la vacante para comenzar a recibir postulaciones.</p>
      </div>
      <JobForm
        title="Crear oferta laboral"
        description="Completa la informacion basica de la vacante."
        submitLabel="Guardar oferta"
        action={createJobAction}
      />
    </div>
  );
}

