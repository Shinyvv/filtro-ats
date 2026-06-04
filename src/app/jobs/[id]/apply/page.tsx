import { JobStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { JobApplyForm } from "@/components/jobs/job-apply-form";
import { prisma } from "@/lib/prisma/prisma";
import { MAX_CV_SIZE_MB } from "@/lib/storage/storage-provider";

import { applyToJobAction } from "./actions";

export const dynamic = "force-dynamic";

type JobApplyPageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

const statusLabels: Record<JobStatus, string> = {
  [JobStatus.ACTIVE]: "Activa",
  [JobStatus.CLOSED]: "Cerrada",
  [JobStatus.DRAFT]: "Borrador",
};

function getErrorMessage(error: string | undefined): string | null {
  if (!error) {
    return null;
  }

  const messages: Record<string, string> = {
    closed: "Esta oferta no esta disponible para nuevas postulaciones.",
    duplicate: "Ya existe una postulacion registrada con este correo para esta oferta.",
    email: "Ingresa un email valido.",
    file: "Sube tu CV en formato PDF o DOCX.",
    file_required: "Debes adjuntar tu CV.",
    file_size: `El CV no puede superar ${MAX_CV_SIZE_MB} MB.`,
    name: "Ingresa tu nombre completo.",
    rate_limit: "Recibimos varios intentos en poco tiempo. Vuelve a intentarlo mas tarde.",
    server: "No se pudo enviar la postulacion. Intentalo nuevamente.",
    validation: "Revisa los campos requeridos y vuelve a intentar.",
  };

  return messages[error] ?? "No se pudo enviar la postulacion.";
}

function getUnavailableMessage(jobExists: boolean): string {
  if (!jobExists) {
    return "No encontramos esta oferta o ya no esta publicada.";
  }

  return "Esta oferta no esta disponible para nuevas postulaciones.";
}

export default async function JobApplyPage({
  params,
  searchParams,
}: JobApplyPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const errorValue = resolvedSearchParams.error;
  const error = Array.isArray(errorValue) ? errorValue[0] : errorValue;
  const errorMessage = getErrorMessage(error);

  const job = await prisma.job.findUnique({
    where: { id: resolvedParams.id },
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      location: true,
      modality: true,
      contractType: true,
      status: true,
      company: {
        select: {
          name: true,
        },
      },
    },
  });

  const isActive = job?.status === JobStatus.ACTIVE;
  const action = isActive ? applyToJobAction.bind(null, job.id) : null;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-8 sm:py-10">
      <section className="rounded-lg border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold text-zinc-950">
                {job?.title ?? "Oferta no disponible"}
              </h1>
              <Badge variant={isActive ? "success" : "secondary"}>
                {job ? statusLabels[job.status] : "No disponible"}
              </Badge>
            </div>
            {job?.company?.name ? (
              <p className="text-sm font-medium text-zinc-700">{job.company.name}</p>
            ) : null}
          </div>

          {job ? (
            <dl className="grid gap-2 text-sm text-zinc-600 sm:min-w-56">
              <div>
                <dt className="font-medium text-zinc-800">Ubicacion</dt>
                <dd>{job.location || "No especificada"}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-800">Modalidad</dt>
                <dd>{job.modality || "No especificada"}</dd>
              </div>
              <div>
                <dt className="font-medium text-zinc-800">Contrato</dt>
                <dd>{job.contractType || "No especificado"}</dd>
              </div>
            </dl>
          ) : null}
        </div>

        {job ? (
          <div className="mt-5 space-y-4 text-sm leading-6 text-zinc-700">
            <div>
              <h2 className="font-medium text-zinc-900">Descripcion</h2>
              <p className="mt-1 whitespace-pre-wrap">{job.description}</p>
            </div>
            <div>
              <h2 className="font-medium text-zinc-900">Requisitos</h2>
              <p className="mt-1 whitespace-pre-wrap">{job.requirements}</p>
            </div>
          </div>
        ) : (
          <p className="mt-4 text-sm text-zinc-700">{getUnavailableMessage(false)}</p>
        )}
      </section>

      {!isActive ? (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          {getUnavailableMessage(Boolean(job))}
        </div>
      ) : null}

      {isActive && action ? (
        <JobApplyForm action={action} serverErrorMessage={errorMessage} />
      ) : null}
    </main>
  );
}
