import { JobStatus } from "@prisma/client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

type JobFormValues = {
  title: string;
  description: string;
  requirements: string;
  location: string;
  modality: string;
  contractType: string;
  status: JobStatus;
};

type JobFormProps = {
  title: string;
  description?: string;
  submitLabel: string;
  action: (formData: FormData) => Promise<void>;
  defaultValues?: Partial<JobFormValues>;
};

export function JobForm({
  title,
  description,
  submitLabel,
  action,
  defaultValues,
}: JobFormProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description ? <p className="text-sm text-zinc-500">{description}</p> : null}
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="title">Titulo</Label>
            <Input id="title" name="title" required defaultValue={defaultValues?.title ?? ""} />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="description">Descripcion</Label>
            <Textarea
              id="description"
              name="description"
              required
              defaultValue={defaultValues?.description ?? ""}
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="requirements">Requisitos</Label>
            <Textarea
              id="requirements"
              name="requirements"
              required
              defaultValue={defaultValues?.requirements ?? ""}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="location">Ubicacion</Label>
              <Input
                id="location"
                name="location"
                required
                defaultValue={defaultValues?.location ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="modality">Modalidad</Label>
              <Input
                id="modality"
                name="modality"
                required
                defaultValue={defaultValues?.modality ?? ""}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="contractType">Tipo de contrato</Label>
              <Input
                id="contractType"
                name="contractType"
                required
                defaultValue={defaultValues?.contractType ?? ""}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="status">Estado</Label>
            <Select
              id="status"
              name="status"
              defaultValue={defaultValues?.status ?? JobStatus.DRAFT}
            >
              <option value={JobStatus.DRAFT}>Borrador</option>
              <option value={JobStatus.ACTIVE}>Activa</option>
              <option value={JobStatus.CLOSED}>Cerrada</option>
            </Select>
          </div>

          <div className="flex justify-end">
            <Button type="submit">{submitLabel}</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

