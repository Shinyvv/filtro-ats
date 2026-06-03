"use client";

import { CandidateStatus } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import {
  updateCandidateInternalNotesAction,
  updateCandidateStatusAction,
} from "@/app/dashboard/candidates/actions";
import { CandidateStatusSelect } from "@/components/candidates/candidate-status-select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import {
  getCandidateStatusBadgeVariant,
  getCandidateStatusLabel,
} from "@/lib/candidates/status";
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
  cvFileName: string | null;
  cvMimeType: string | null;
  internalNotes: string | null;
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

export function CandidateDetailCard({ candidate }: CandidateDetailCardProps) {
  const router = useRouter();
  const [notes, setNotes] = useState(candidate.internalNotes ?? "");
  const [notesMessage, setNotesMessage] = useState<string | null>(null);
  const [quickActionMessage, setQuickActionMessage] = useState<string | null>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [isNotesPending, startNotesTransition] = useTransition();
  const [isQuickActionPending, startQuickActionTransition] = useTransition();
  const cvHref = `/dashboard/candidates/${candidate.id}/cv`;

  function saveNotes(nextNotes = notes): void {
    setNotesMessage(null);
    startNotesTransition(async () => {
      const result = await updateCandidateInternalNotesAction({
        candidateId: candidate.id,
        internalNotes: nextNotes,
      });

      setNotesMessage(result.ok ? result.message : result.error);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  function updateQuickStatus(status: CandidateStatus): void {
    setQuickActionMessage(null);
    startQuickActionTransition(async () => {
      const result = await updateCandidateStatusAction({
        candidateId: candidate.id,
        status,
      });

      setQuickActionMessage(result.ok ? result.message : result.error);
      if (result.ok) {
        router.refresh();
      }
    });
  }

  async function copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(candidate.email);
      setCopiedEmail(true);
      window.setTimeout(() => setCopiedEmail(false), 1800);
    } catch {
      setCopiedEmail(false);
    }
  }

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
            <p className="text-xs uppercase tracking-wide text-zinc-500">Teléfono</p>
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
                ? `${candidate.yearsOfExperience} años`
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
            <p className="text-xs uppercase tracking-wide text-zinc-500">Estado actual</p>
            <Badge variant={getCandidateStatusBadgeVariant(candidate.status)}>
              {getCandidateStatusLabel(candidate.status)}
            </Badge>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500">Postulación</p>
            <p>{formatDate(candidate.createdAt)}</p>
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Acciones rápidas</h2>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => void copyEmail()}>
              {copiedEmail ? "Email copiado" : "Copiar email"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isQuickActionPending}
              onClick={() => updateQuickStatus(CandidateStatus.SHORTLISTED)}
            >
              Preseleccionar
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={isQuickActionPending}
              onClick={() => updateQuickStatus(CandidateStatus.REJECTED)}
            >
              Rechazar
            </Button>
            {candidate.cvFileName ? (
              <Link
                className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 py-2 font-medium transition-colors hover:bg-zinc-50"
                href={cvHref}
              >
                Descargar CV
              </Link>
            ) : null}
          </div>
          {quickActionMessage ? (
            <p className="text-sm text-zinc-600">{quickActionMessage}</p>
          ) : null}
        </section>

        <CandidateStatusSelect
          candidateId={candidate.id}
          currentStatus={candidate.status}
          variant="card"
        />

        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900">Notas internas</h2>
          <Textarea
            value={notes}
            maxLength={2000}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Agrega observaciones internas para RRHH."
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              disabled={isNotesPending}
              onClick={() => saveNotes()}
            >
              {isNotesPending ? "Guardando..." : "Guardar notas"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isNotesPending}
              onClick={() => {
                setNotes("");
                saveNotes("");
              }}
            >
              Limpiar notas
            </Button>
            <p className="text-sm text-zinc-500">{notes.length}/2000</p>
          </div>
          {notesMessage ? <p className="text-sm text-zinc-600">{notesMessage}</p> : null}
        </section>

        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-zinc-900">CV original</h2>
          {candidate.cvFileName ? (
            <div className="flex flex-wrap items-center gap-3 rounded-md border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-sm text-zinc-700">{candidate.cvFileName}</p>
              <Link
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                href={cvHref}
              >
                Descargar CV
              </Link>
            </div>
          ) : (
            <p className="text-sm text-zinc-600">CV no disponible</p>
          )}
        </section>

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
          <p className="text-xs uppercase tracking-wide text-zinc-500">Texto extraído del CV</p>
          <pre className="max-h-[320px] overflow-auto rounded-md border border-zinc-200 bg-zinc-50 p-3 text-xs whitespace-pre-wrap text-zinc-700">
            {candidate.cvText || "No se pudo extraer texto de este CV."}
          </pre>
        </div>
      </CardContent>
    </Card>
  );
}
