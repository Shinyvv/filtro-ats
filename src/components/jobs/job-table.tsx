import Link from "next/link";
import { JobStatus } from "@prisma/client";

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

type JobRow = {
  id: string;
  title: string;
  status: JobStatus;
  createdAt: Date;
  _count: {
    candidates: number;
  };
};

type JobTableProps = {
  jobs: JobRow[];
};

function getStatusBadgeVariant(status: JobStatus): "secondary" | "success" | "warning" {
  if (status === JobStatus.ACTIVE) {
    return "success";
  }

  if (status === JobStatus.CLOSED) {
    return "warning";
  }

  return "secondary";
}

function getStatusLabel(status: JobStatus): string {
  if (status === JobStatus.ACTIVE) {
    return "Activa";
  }

  if (status === JobStatus.CLOSED) {
    return "Cerrada";
  }

  return "Borrador";
}

export function JobTable({ jobs }: JobTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Titulo</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Postulantes</TableHead>
          <TableHead>Fecha creacion</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {jobs.map((job) => (
          <TableRow key={job.id}>
            <TableCell className="font-medium text-zinc-900">{job.title}</TableCell>
            <TableCell>
              <Badge variant={getStatusBadgeVariant(job.status)}>{getStatusLabel(job.status)}</Badge>
            </TableCell>
            <TableCell>{job._count.candidates}</TableCell>
            <TableCell>{formatDate(job.createdAt)}</TableCell>
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

