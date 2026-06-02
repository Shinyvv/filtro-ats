import Link from "next/link";
import { JobStatus } from "@prisma/client";
import { notFound } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";

import { closeJobAction } from "./actions";

export const dynamic = "force-dynamic";

type JobDetailPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

function statusLabel(status: JobStatus): string {
  switch (status) {
    case JobStatus.ACTIVE:
      return "Activa";
    case JobStatus.CLOSED:
      return "Cerrada";
    case JobStatus.DRAFT:
    default:
      return "Borrador";
  }
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const resolvedParams = await params;
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const job = await prisma.job.findFirst({
    where: { id: resolvedParams.id, companyId },
    include: {
      _count: { select: { candidates: true } },
    },
  });

  if (!job) {
    notFound();
  }

  const closeActionWithId = closeJobAction.bind(null, job.id);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">{job.title}</h1>
          <p className="text-zinc-600">Detalle de la oferta y estado operativo.</p>
        </div>
        <div className="flex gap-2">
          <Link
            href={`/dashboard/jobs/${job.id}/edit`}
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Editar
          </Link>
          <Link
            href={`/dashboard/jobs/${job.id}/candidates`}
            className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Ver postulantes
          </Link>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informacion de la oferta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant={job.status === JobStatus.ACTIVE ? "success" : "secondary"}>
              {statusLabel(job.status)}
            </Badge>
            <p className="text-sm text-zinc-600">{job._count.candidates} postulantes</p>
          </div>

          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Descripcion</p>
            <p className="mt-1 whitespace-pre-wrap text-zinc-700">{job.description}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Requisitos</p>
            <p className="mt-1 whitespace-pre-wrap text-zinc-700">{job.requirements}</p>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Ubicacion</p>
              <p>{job.location}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Modalidad</p>
              <p>{job.modality}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-zinc-500">Contrato</p>
              <p>{job.contractType}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href={`/jobs/${job.id}/apply`}
              className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Enlace publico de postulacion
            </Link>
            {job.status !== JobStatus.CLOSED ? (
              <form action={closeActionWithId}>
                <Button type="submit" variant="secondary">
                  Cerrar oferta
                </Button>
              </form>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

