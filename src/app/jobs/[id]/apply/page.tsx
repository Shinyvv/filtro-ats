import { notFound } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { prisma } from "@/lib/prisma/prisma";

import { applyToJobAction } from "./actions";

type JobApplyPageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

function getErrorMessage(error: string | undefined): string | null {
  if (!error) {
    return null;
  }

  if (error === "validation") {
    return "Revisa los campos requeridos y vuelve a intentar.";
  }

  if (error === "file") {
    return "El archivo debe ser PDF o DOCX y no superar 5MB.";
  }

  return "No se pudo enviar la postulacion.";
}

export default async function JobApplyPage({
  params,
  searchParams,
}: JobApplyPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const errorValue = resolvedSearchParams.error;
  const error = Array.isArray(errorValue) ? errorValue[0] : errorValue;
  const errorMessage = getErrorMessage(error);

  const job = await prisma.job.findUnique({
    where: { id: resolvedParams.id },
    select: {
      id: true,
      title: true,
      description: true,
      requirements: true,
      location: true,
      modality: true,
      contractType: true,
    },
  });

  if (!job) {
    notFound();
  }

  const action = applyToJobAction.bind(null, job.id);

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 px-4 py-8">
      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">{job.title}</h1>
        <p className="mt-2 whitespace-pre-wrap text-zinc-700">{job.description}</p>
        <p className="mt-4 text-sm text-zinc-600">
          <span className="font-medium text-zinc-800">Requisitos:</span> {job.requirements}
        </p>
        <p className="mt-2 text-sm text-zinc-600">
          {job.location} · {job.modality} · {job.contractType}
        </p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Formulario de postulacion</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="fullName">Nombre completo</Label>
              <Input id="fullName" name="fullName" required />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefono</Label>
                <Input id="phone" name="phone" required />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="currentPosition">Cargo actual</Label>
                <Input id="currentPosition" name="currentPosition" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="yearsOfExperience">Anos de experiencia</Label>
                <Input id="yearsOfExperience" name="yearsOfExperience" type="number" min="0" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="expectedSalary">Sueldo esperado</Label>
                <Input id="expectedSalary" name="expectedSalary" type="number" min="0" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="availability">Disponibilidad</Label>
                <Input id="availability" name="availability" placeholder="Ej: Inmediata" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="cvFile">CV (PDF o DOCX, max 5MB)</Label>
              <Input
                id="cvFile"
                name="cvFile"
                type="file"
                required
                accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="notes">Mensaje adicional (opcional)</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Puedes agregar informacion complementaria para RRHH."
              />
            </div>

            {errorMessage ? (
              <p className="rounded-md border border-red-200 bg-red-50 p-2 text-sm text-red-700">
                {errorMessage}
              </p>
            ) : null}

            <Button type="submit">Enviar postulacion</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}

