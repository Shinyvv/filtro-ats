import { CandidateStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

type CandidateStatusSelectProps = {
  candidateId: string;
  currentStatus: CandidateStatus;
  action: (formData: FormData) => Promise<void>;
};

export function CandidateStatusSelect({
  candidateId,
  currentStatus,
  action,
}: CandidateStatusSelectProps) {
  return (
    <form action={action} className="grid gap-3 rounded-lg border border-zinc-200 p-4">
      <input type="hidden" name="candidateId" value={candidateId} />
      <div className="grid gap-2">
        <Label htmlFor="status">Estado del postulante</Label>
        <Select id="status" name="status" defaultValue={currentStatus}>
          <option value={CandidateStatus.NEW}>Nuevo</option>
          <option value={CandidateStatus.REVIEWING}>En revisión</option>
          <option value={CandidateStatus.SHORTLISTED}>Preseleccionado</option>
          <option value={CandidateStatus.CONTACTED}>Contactado</option>
          <option value={CandidateStatus.REJECTED}>Rechazado</option>
        </Select>
      </div>
      <div>
        <Button type="submit" variant="secondary">
          Actualizar estado
        </Button>
      </div>
    </form>
  );
}

