-- Normaliza emails existentes para evitar colisiones por mayusculas/espacios.
UPDATE "Candidate" SET "email" = lower(trim("email"));

-- Elimina duplicados previos (conserva el registro mas antiguo por jobId+email).
DELETE FROM "Candidate" c
USING "Candidate" d
WHERE c."jobId" = d."jobId"
  AND c."email" = d."email"
  AND c."createdAt" > d."createdAt";

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_jobId_email_key" ON "Candidate"("jobId", "email");
