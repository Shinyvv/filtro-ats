"use client";

import { CandidateStatus } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { updateCandidateStatusAction } from "@/app/dashboard/candidates/actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  candidateStatusOptions,
  getCandidateStatusLabel,
} from "@/lib/candidates/status";

type CandidateStatusSelectProps = {
  candidateId: string;
  currentStatus: CandidateStatus;
  variant?: "card" | "inline";
};

function toCandidateStatus(value: string): CandidateStatus {
  return value as CandidateStatus;
}

export function CandidateStatusSelect({
  candidateId,
  currentStatus,
  variant = "card",
}: CandidateStatusSelectProps) {
  const router = useRouter();
  const [selectedStatus, setSelectedStatus] = useState<CandidateStatus>(currentStatus);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const isInline = variant === "inline";

  useEffect(() => {
    setSelectedStatus(currentStatus);
    setMessage(null);
  }, [currentStatus]);

  function updateStatus(nextStatus: CandidateStatus): void {
    if (nextStatus === currentStatus) {
      return;
    }

    setMessage(null);
    startTransition(async () => {
      const result = await updateCandidateStatusAction({
        candidateId,
        status: nextStatus,
      });

      if (!result.ok) {
        setMessage(result.error);
        setSelectedStatus(currentStatus);
        return;
      }

      setSelectedStatus(nextStatus);
      setMessage(isInline ? null : result.message);
      router.refresh();
    });
  }

  function handleSelectChange(value: string): void {
    const nextStatus = toCandidateStatus(value);
    setSelectedStatus(nextStatus);

    if (isInline) {
      updateStatus(nextStatus);
    }
  }

  if (isInline) {
    return (
      <div className="grid min-w-[150px] gap-1">
        <Select
          aria-label="Estado del postulante"
          value={selectedStatus}
          onChange={(event) => handleSelectChange(event.target.value)}
          disabled={isPending}
          className="h-9"
        >
          {candidateStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {message ? <p className="text-xs text-red-700">{message}</p> : null}
      </div>
    );
  }

  return (
    <section className="grid gap-3 rounded-lg border border-zinc-200 p-4">
      <div className="grid gap-2">
        <Label htmlFor={`candidate-status-${candidateId}`}>Estado del postulante</Label>
        <Select
          id={`candidate-status-${candidateId}`}
          value={selectedStatus}
          onChange={(event) => handleSelectChange(event.target.value)}
          disabled={isPending}
        >
          {candidateStatusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="secondary"
          disabled={isPending || selectedStatus === currentStatus}
          onClick={() => updateStatus(selectedStatus)}
        >
          {isPending ? "Actualizando..." : "Actualizar estado"}
        </Button>
        <p className="text-sm text-zinc-600">
          Actual: {getCandidateStatusLabel(currentStatus)}
        </p>
      </div>
      {message ? (
        <p className={message.includes("correctamente") ? "text-sm text-emerald-700" : "text-sm text-red-700"}>
          {message}
        </p>
      ) : null}
    </section>
  );
}
