"use client";

import Link from "next/link";
import { CandidateStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { CandidateStatusSelect } from "@/components/candidates/candidate-status-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { candidateStatusOptions } from "@/lib/candidates/status";
import { formatDate } from "@/lib/utils";

type CandidateRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string | null;
  yearsOfExperience: number | null;
  aiScore: number | null;
  status: CandidateStatus;
  createdAt: Date;
  cvFileName: string | null;
};

type CandidateTableProps = {
  candidates: CandidateRow[];
  jobId: string;
  currentStatus?: CandidateStatus;
  currentQuery?: string;
};

function getCandidatesHref(jobId: string, status?: string, query?: string): string {
  const params = new URLSearchParams();

  if (status) {
    params.set("status", status);
  }

  if (query?.trim()) {
    params.set("q", query.trim());
  }

  const queryString = params.toString();
  return queryString
    ? `/dashboard/jobs/${jobId}/candidates?${queryString}`
    : `/dashboard/jobs/${jobId}/candidates`;
}

export function CandidateTable({
  candidates,
  jobId,
  currentStatus,
  currentQuery,
}: CandidateTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>(currentStatus ?? "");
  const [queryFilter, setQueryFilter] = useState<string>(currentQuery ?? "");
  const [copiedCandidateId, setCopiedCandidateId] = useState<string | null>(null);
  const hasFilters = Boolean(currentStatus || currentQuery);

  function applyFilters(): void {
    router.push(getCandidatesHref(jobId, statusFilter, queryFilter));
  }

  function clearFilters(): void {
    setStatusFilter("");
    setQueryFilter("");
    router.push(`/dashboard/jobs/${jobId}/candidates`);
  }

  async function copyEmail(candidateId: string, email: string): Promise<void> {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedCandidateId(candidateId);
      window.setTimeout(() => setCopiedCandidateId(null), 1800);
    } catch {
      setCopiedCandidateId(null);
    }
  }

  return (
    <div>
      <div className="grid gap-3 border-b border-zinc-200 p-4 md:grid-cols-[180px_1fr_auto_auto]">
        <Select
          aria-label="Filtrar por estado"
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
        >
          <option value="">Todos los estados</option>
          {candidateStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        <Input
          value={queryFilter}
          onChange={(event) => setQueryFilter(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              applyFilters();
            }
          }}
          placeholder="Buscar por nombre o email"
        />
        <Button type="button" onClick={applyFilters}>
          Aplicar
        </Button>
        <Button type="button" variant="outline" onClick={clearFilters}>
          Limpiar
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Teléfono</TableHead>
            <TableHead>Experiencia</TableHead>
            <TableHead>Score IA</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Postulación</TableHead>
            <TableHead className="text-right">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {candidates.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="h-28 text-center text-zinc-500">
                {hasFilters
                  ? "No hay postulantes que coincidan con los filtros."
                  : "Todavía no hay postulantes para esta oferta."}
              </TableCell>
            </TableRow>
          ) : (
            candidates.map((candidate) => (
              <TableRow key={candidate.id}>
                <TableCell className="font-medium text-zinc-900">
                  {candidate.fullName}
                </TableCell>
                <TableCell>{candidate.email}</TableCell>
                <TableCell>{candidate.phone ?? "No informado"}</TableCell>
                <TableCell>
                  {candidate.yearsOfExperience !== null
                    ? `${candidate.yearsOfExperience} años`
                    : "No informado"}
                </TableCell>
                <TableCell>{candidate.aiScore ?? "-"}</TableCell>
                <TableCell>
                  <CandidateStatusSelect
                    candidateId={candidate.id}
                    currentStatus={candidate.status}
                    variant="inline"
                  />
                </TableCell>
                <TableCell>{formatDate(candidate.createdAt)}</TableCell>
                <TableCell className="text-right">
                  <div className="flex flex-wrap justify-end gap-2">
                    <Link
                      className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                      href={`/dashboard/candidates/${candidate.id}`}
                    >
                      Detalle
                    </Link>
                    {candidate.cvFileName ? (
                      <Link
                        className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                        href={`/dashboard/candidates/${candidate.id}/cv`}
                      >
                        Descargar CV
                      </Link>
                    ) : null}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => void copyEmail(candidate.id, candidate.email)}
                    >
                      {copiedCandidateId === candidate.id ? "Copiado" : "Copiar email"}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
