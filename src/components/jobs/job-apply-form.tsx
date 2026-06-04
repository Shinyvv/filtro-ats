"use client";

import { type FormEvent, type ReactElement, useRef, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CV_ALLOWED_EXTENSIONS,
  CV_ALLOWED_MIME_TYPES,
  MAX_CV_SIZE_BYTES,
  MAX_CV_SIZE_MB,
  type AllowedCvExtension,
  type AllowedCvMimeType,
} from "@/lib/storage/storage-provider";

import { SubmitButton } from "@/app/jobs/[id]/apply/submit-button";

const CV_ACCEPT =
  ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

type JobApplyFormProps = {
  action: (formData: FormData) => Promise<void> | void;
  serverErrorMessage: string | null;
};

function getFileExtension(fileName: string): string {
  return fileName.toLowerCase().match(/\.[^.]+$/)?.[0] ?? "";
}

function getExpectedExtension(mimeType: string): AllowedCvExtension | null {
  if (mimeType === "application/pdf") {
    return ".pdf";
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return ".docx";
  }

  return null;
}

function validateCvFile(file: File | undefined): string | null {
  if (!file) {
    return "Debes adjuntar tu CV.";
  }

  if (file.size === 0) {
    return "El CV no puede estar vacio.";
  }

  if (file.size > MAX_CV_SIZE_BYTES) {
    return `El CV no puede superar los ${MAX_CV_SIZE_MB} MB.`;
  }

  if (!CV_ALLOWED_MIME_TYPES.includes(file.type as AllowedCvMimeType)) {
    return "Sube tu CV en formato PDF o DOCX.";
  }

  const extension = getFileExtension(file.name);
  if (!CV_ALLOWED_EXTENSIONS.includes(extension as AllowedCvExtension)) {
    return "Sube tu CV en formato PDF o DOCX.";
  }

  const expectedExtension = getExpectedExtension(file.type);
  if (!expectedExtension || extension !== expectedExtension) {
    return "La extension del CV no coincide con su formato.";
  }

  return null;
}

export function JobApplyForm({
  action,
  serverErrorMessage,
}: JobApplyFormProps): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fileErrorMessage, setFileErrorMessage] = useState<string | null>(null);

  function getSelectedFile(): File | undefined {
    return fileInputRef.current?.files?.[0];
  }

  function handleFileChange(): void {
    setFileErrorMessage(validateCvFile(getSelectedFile()));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>): void {
    const errorMessage = validateCvFile(getSelectedFile());
    setFileErrorMessage(errorMessage);

    if (errorMessage) {
      event.preventDefault();
    }
  }

  const cvDescriptionId = fileErrorMessage ? "cvFileHelp cvFileError" : "cvFileHelp";

  return (
    <Card className="rounded-lg">
      <CardHeader>
        <CardTitle>Formulario de postulacion</CardTitle>
        <CardDescription>
          Completa tus datos y adjunta tu CV para enviar la postulacion.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-5" onSubmit={handleSubmit}>
          <div className="grid gap-2">
            <Label htmlFor="fullName">Nombre completo</Label>
            <Input
              id="fullName"
              name="fullName"
              autoComplete="name"
              required
              maxLength={120}
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Telefono opcional</Label>
              <Input
                id="phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                maxLength={30}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="currentPosition">Cargo actual opcional</Label>
              <Input
                id="currentPosition"
                name="currentPosition"
                autoComplete="organization-title"
                maxLength={120}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="yearsOfExperience">Anos de experiencia</Label>
              <Input
                id="yearsOfExperience"
                name="yearsOfExperience"
                type="number"
                min="0"
                max="60"
                inputMode="numeric"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="expectedSalary">Sueldo esperado</Label>
              <Input
                id="expectedSalary"
                name="expectedSalary"
                type="number"
                min="0"
                inputMode="numeric"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="availability">Disponibilidad</Label>
              <Input
                id="availability"
                name="availability"
                placeholder="Ej: Inmediata"
                maxLength={120}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="cvFile">CV</Label>
            <Input
              id="cvFile"
              ref={fileInputRef}
              name="cvFile"
              type="file"
              required
              aria-describedby={cvDescriptionId}
              aria-invalid={Boolean(fileErrorMessage)}
              accept={CV_ACCEPT}
              onChange={handleFileChange}
            />
            <p id="cvFileHelp" className="text-sm text-zinc-600">
              Sube tu CV en formato PDF o DOCX. Tamano maximo: {MAX_CV_SIZE_MB} MB.
            </p>
            {fileErrorMessage ? (
              <p id="cvFileError" role="alert" className="text-sm font-medium text-red-700">
                {fileErrorMessage}
              </p>
            ) : null}
          </div>

          {serverErrorMessage ? (
            <p
              role="alert"
              className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {serverErrorMessage}
            </p>
          ) : null}

          <SubmitButton />
        </form>
      </CardContent>
    </Card>
  );
}
