import { CandidateStatus } from "@prisma/client";

export type CandidateStatusBadgeVariant =
  | "secondary"
  | "success"
  | "warning"
  | "danger"
  | "outline";

type CandidateStatusOption = {
  value: CandidateStatus;
  label: string;
  badgeVariant: CandidateStatusBadgeVariant;
};

export const candidateStatusOptions: CandidateStatusOption[] = [
  {
    value: CandidateStatus.NEW,
    label: "Nuevo",
    badgeVariant: "secondary",
  },
  {
    value: CandidateStatus.REVIEWING,
    label: "En revisión",
    badgeVariant: "outline",
  },
  {
    value: CandidateStatus.SHORTLISTED,
    label: "Preseleccionado",
    badgeVariant: "success",
  },
  {
    value: CandidateStatus.REJECTED,
    label: "Rechazado",
    badgeVariant: "danger",
  },
  {
    value: CandidateStatus.CONTACTED,
    label: "Contactado",
    badgeVariant: "warning",
  },
  {
    value: CandidateStatus.HIRED,
    label: "Contratado",
    badgeVariant: "success",
  },
];

const candidateStatusByValue = new Map(
  candidateStatusOptions.map((option) => [option.value, option]),
);

export function getCandidateStatusLabel(status: CandidateStatus): string {
  return candidateStatusByValue.get(status)?.label ?? status;
}

export function getCandidateStatusBadgeVariant(
  status: CandidateStatus,
): CandidateStatusBadgeVariant {
  return candidateStatusByValue.get(status)?.badgeVariant ?? "secondary";
}
