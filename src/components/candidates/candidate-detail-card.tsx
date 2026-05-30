import type { CandidateStatus } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

type CandidateDetailData = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  currentPosition: string;
  yearsOfExperience: number | null;
  expectedSalary: number | null;
  availability: string | null;
  cvText: string;
  aiSummary: string | null;
  aiScore: number | null;
  status: CandidateStatus;
  createdAt: Date;
  job: {
    id: string;
    title: string;
  };
};

type CandidateDetailCardProps = {
  candidate: CandidateDetailData;
};

function statusLabel(status: CandidateStatus): string {
  switch (status) {
    case "NEW":
      return "Nuevo";
    case "REVIEWING":
      return "En revision";
    case "SHORTLISTED":
      return "Preseleccionado";
    case "REJECTED":
      return "Rechazado";
    case "CONTACTED":
      return "Contactado";
    default:
      return status;
  }
}

export function CandidateDetailCard({
  candidate,
}: CandidateDetailCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Detalle de postulante</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Nombre</p>
            <p className="font-medium text-zinc-900">{candidate.fullName}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Oferta</p>
            <p className="font-medium text-zinc-900">{candidate.job.title}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Email</p>
            <p>{candidate.email}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Telefono</p>
            <p>{candidate.phone}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Cargo actual</p>
            <p>{candidate.currentPosition}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Experiencia</p>
            <p>
              {candidate.yearsOfExperience !== null
                ? `${candidate.yearsOfExperience} anos`
                : "No informado"}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Sueldo esperado</p>
            <p>{candidate.expectedSalary ?? "No informado"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Disponibilidad</p>
            <p>{candidate.availability ?? "No informada"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Estado</p>
            <Badge variant="secondary">{statusLabel(candidate.status)}</Badge>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Postulacion</p>
            <p>{formatDate(candidate.createdAt)}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Score IA</p>
          <p className="text-xl font-semibold text-zinc-900">{candidate.aiScore ?? "-"}</p>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Resumen IA</p>
          <p className="rounded-md border border-zinc-200 bg-zinc-50 p-3 text-sm text-zinc-700">
            {candidate.aiSummary ?? "Sin resumen generado"}
          </p>
        </div>

        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-zinc-500">Texto extraido del CV</p>
          <pre className="max-h-[320px] overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs whitespace-pre-wrap text-zinc-700">
            {candidate.cvText || "No se pudo extraer texto de este CV."}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}

