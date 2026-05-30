import Link from "next/link";
import { CandidateStatus } from "@prisma/client";

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

type CandidateRow = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  yearsOfExperience: number | null;
  aiScore: number | null;
  status: CandidateStatus;
  createdAt: Date;
};

type CandidateTableProps = {
  candidates: CandidateRow[];
};

function getStatusLabel(status: CandidateStatus): string {
  switch (status) {
    case CandidateStatus.NEW:
      return "Nuevo";
    case CandidateStatus.REVIEWING:
      return "En revision";
    case CandidateStatus.SHORTLISTED:
      return "Preseleccionado";
    case CandidateStatus.REJECTED:
      return "Rechazado";
    case CandidateStatus.CONTACTED:
      return "Contactado";
    default:
      return status;
  }
}

function getStatusVariant(
  status: CandidateStatus,
): "secondary" | "success" | "warning" | "danger" | "outline" {
  switch (status) {
    case CandidateStatus.NEW:
      return "secondary";
    case CandidateStatus.REVIEWING:
      return "outline";
    case CandidateStatus.SHORTLISTED:
      return "success";
    case CandidateStatus.REJECTED:
      return "danger";
    case CandidateStatus.CONTACTED:
      return "warning";
    default:
      return "secondary";
  }
}

export function CandidateTable({ candidates }: CandidateTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nombre</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Telefono</TableHead>
          <TableHead>Experiencia</TableHead>
          <TableHead>Score IA</TableHead>
          <TableHead>Estado</TableHead>
          <TableHead>Postulacion</TableHead>
          <TableHead className="text-right">Acciones</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {candidates.map((candidate) => (
          <TableRow key={candidate.id}>
            <TableCell className="font-medium text-zinc-900">{candidate.fullName}</TableCell>
            <TableCell>{candidate.email}</TableCell>
            <TableCell>{candidate.phone}</TableCell>
            <TableCell>
              {candidate.yearsOfExperience !== null
                ? `${candidate.yearsOfExperience} anos`
                : "No informado"}
            </TableCell>
            <TableCell>{candidate.aiScore ?? "-"}</TableCell>
            <TableCell>
              <Badge variant={getStatusVariant(candidate.status)}>
                {getStatusLabel(candidate.status)}
              </Badge>
            </TableCell>
            <TableCell>{formatDate(candidate.createdAt)}</TableCell>
            <TableCell className="text-right">
              <Link
                className="inline-flex h-9 items-center justify-center rounded-md border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                href={`/dashboard/candidates/${candidate.id}`}
              >
                Detalle
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

