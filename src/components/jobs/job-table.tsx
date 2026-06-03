"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { JobStatus } from "@prisma/client";
import type { KeyboardEvent, MouseEvent } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";

const JOB_STATUS = {
  ACTIVE: "ACTIVE",
  CLOSED: "CLOSED",
} satisfies Record<string, JobStatus>;

type JobRow = {
  id: string;
  title: string;
  status: JobStatus;
  createdAt: string;
  _count: {
    candidates: number;
  };
  newCandidatesCount: number;
};

type JobTableProps = {
  jobs: JobRow[];
};

function getStatusBadgeVariant(status: JobStatus): "secondary" | "success" | "warning" {
  if (status === JOB_STATUS.ACTIVE) {
    return "success";
  }

  if (status === JOB_STATUS.CLOSED) {
    return "warning";
  }

  return "secondary";
}

function getStatusLabel(status: JobStatus): string {
  if (status === JOB_STATUS.ACTIVE) {
    return "Activa";
  }

  if (status === JOB_STATUS.CLOSED) {
    return "Cerrada";
  }

  return "Borrador";
}

function isInteractiveTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  return Boolean(target.closest("a,button,input,select,textarea"));
}

export function JobTable({ jobs }: JobTableProps) {
  const router = useRouter();

  function goToJob(jobId: string): void {
    router.push(`/dashboard/jobs/${jobId}`);
  }

  function handleRowClick(
    jobId: string,
    event: MouseEvent<HTMLTableRowElement>,
  ): void {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    goToJob(jobId);
  }

  function handleRowKeyDown(
    jobId: string,
    event: KeyboardEvent<HTMLTableRowElement>,
  ): void {
    if (isInteractiveTarget(event.target)) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToJob(jobId);
    }
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Título</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Postulantes</TableHead>
          <TableHead>Nuevos postulantes</TableHead>
          <TableHead>Fecha creación</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow
            key={job.id}
            aria-label={`Ver detalle de ${job.title}`}
            className="cursor-pointer hover:bg-zinc-100"
            onClick={(event) => handleRowClick(job.id, event)}
            onKeyDown={(event) => handleRowKeyDown(job.id, event)}
            role="link"
            tabIndex={0}
          >
            <TableCell className="font-medium text-zinc-900">{job.title}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(job.status)}>{getStatusLabel(job.status)}</Badge>
            </TableCell>
            <TableCell>{job._count.candidates}</TableCell>
            <TableCell>
              {job.newCandidatesCount > 0 ? (
                <Badge variant="success">{job.newCandidatesCount} nuevos</Badge>
              ) : (
                <span className="text-sm text-zinc-500">Sin nuevos</span>
              )}
            </TableCell>
            <TableCell>{formatDate(new Date(job.createdAt))}</TableCell>
            <TableCell className="text-right">
              <div className="flex justify-end gap-2">
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  href={`/dashboard/jobs/${job.id}`}
                >
                  Ver
                </Link>
                <Link
                  className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  href={`/dashboard/jobs/${job.id}/candidates`}
                >
                  Postulantes
                </Link>
              </div>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

