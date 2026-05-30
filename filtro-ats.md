# Handoff - filtro-ats

## Estado general
Se construyo desde cero la base de la Fase 1 del MVP ATS en `C:\Users\danie\OneDrive\Desktop\Joseo\filtro-ats`.
El proyecto ya tiene estructura App Router, Prisma, autenticacion simple, CRUD inicial de ofertas, formulario publico de postulacion, upload de CV, parser de CV y capa AI mock/Gemini desacoplada.

## Lo que ya quedo implementado

### 1) Base del proyecto y configuracion
- `package.json` con stack solicitado (Next 16.2.6, React 19, Prisma 7.8.0, Tailwind 4.3.0, motion 12.38.0, shadcn CLI 4.7.0, etc).
- Configuracion inicial:
  - `tsconfig.json`
  - `next.config.ts`
  - `postcss.config.mjs`
  - `tailwind.config.ts`
  - `next-env.d.ts`
  - `.env.example`
  - `.gitignore`
- Estructura de carpetas completa para `src/app`, `src/components`, `src/lib`, `prisma`, `uploads/cvs`.

### 2) Modelo de datos Prisma
- `prisma/schema.prisma` con:
  - `User`, `Company`, `Job`, `Candidate`
  - enums: `UserRole`, `JobStatus`, `CandidateStatus`
- `prisma/seed.ts` con:
  - empresa demo
  - admin demo (`admin@demo.com` / `admin123` hasheada)
  - oferta demo activa
- `src/lib/prisma/prisma.ts` con singleton de Prisma Client.

### 3) Autenticacion simple (sin NextAuth)
- `src/lib/auth/password.ts` (hash + verify con bcryptjs)
- `src/lib/auth/session.ts` (cookie firmada HMAC)
- `src/lib/auth/auth.ts` (`getCurrentUser`, `requireUser`, create/clear session)
- `src/app/login/page.tsx` + `src/app/login/actions.ts`
- `middleware.ts` protegiendo `/dashboard/*` y manejo de `/login`.

### 4) Jobs (ofertas) - dashboard interno
- Listado, creacion, edicion, cierre por estado y detalle:
  - `src/app/dashboard/jobs/page.tsx`
  - `src/app/dashboard/jobs/new/page.tsx`
  - `src/app/dashboard/jobs/new/actions.ts`
  - `src/app/dashboard/jobs/[id]/page.tsx`
  - `src/app/dashboard/jobs/[id]/edit/page.tsx`
  - `src/app/dashboard/jobs/[id]/actions.ts`
- Vista de postulantes por oferta:
  - `src/app/dashboard/jobs/[id]/candidates/page.tsx`

### 5) Postulaciones publicas y candidatos
- Flujo publico:
  - `src/app/jobs/[id]/apply/page.tsx`
  - `src/app/jobs/[id]/apply/actions.ts`
  - `src/app/jobs/[id]/apply/success/page.tsx`
- Persistencia de candidatos en DB con estado `NEW`.
- Dashboard candidato detalle + cambio de estado:
  - `src/app/dashboard/candidates/[id]/page.tsx`
  - `src/app/dashboard/candidates/[id]/actions.ts`

### 6) Storage / parser CV / AI
- Storage desacoplado:
  - `src/lib/storage/storage-provider.ts`
  - `src/lib/storage/local-storage-provider.ts`
- Parser CV:
  - `src/lib/cv/cv-parser.ts`
  - PDF via `pdf-parse`
  - DOCX via `mammoth`
  - falla controlada sin romper flujo
- Capa AI:
  - `src/lib/ai/candidate-evaluator.ts`
  - `src/lib/ai/providers/mock-ai-provider.ts`
  - `src/lib/ai/providers/gemini-provider.ts`
  - fallback a mock si Gemini falla o no hay key

### 7) Validaciones y UI base
- Zod:
  - `src/lib/validations/auth.schema.ts`
  - `src/lib/validations/job.schema.ts`
  - `src/lib/validations/candidate.schema.ts`
- Componentes UI y dashboard listos:
  - `src/components/ui/*`
  - `src/components/dashboard/*`
  - `src/components/jobs/*`
  - `src/components/candidates/*`

## Comandos ejecutados y resultado
- `pnpm.cmd install` -> OK
- `pnpm.cmd prisma generate` -> OK despues de ajustar config Prisma 7
- `pnpm.cmd build` -> sigue FALLANDO

## Bloqueo actual
El build falla en fase de page data collection con Prisma 7:

- Error: `Using engine type "client" requires either "adapter" or "accelerateUrl" to be provided to PrismaClient constructor.`

Aunque en `schema.prisma` se definio `engineType = "binary"`, el runtime sigue evaluando modo `client` durante `next build`.

## Ajustes hechos por compatibilidad real
- TypeScript ajustado de `6.0.0` a `6.0.3` porque `6.0.0` no existia en registry.
- Se agrego `prisma.config.ts` porque Prisma 7 ya no permite `url = env("DATABASE_URL")` dentro de `datasource`.

## Proximo paso recomendado (para quien retome)
1. Resolver definitivamente el modo engine de Prisma 7 para que `next build` no requiera `adapter/accelerateUrl`.
2. Re-ejecutar:
   - `pnpm prisma generate`
   - `pnpm build`
3. Si compila, validar runtime:
   - `pnpm dev`
   - `pnpm prisma migrate dev`
   - `pnpm prisma db seed`
4. Crear/actualizar `README.md` final con nota de version ajustada (TypeScript 6.0.3) y pasos exactos de setup local.

## Nota final
La base funcional y la arquitectura de Fase 1 quedaron avanzadas y coherentes. El principal pendiente tecnico es cerrar el tema Prisma 7 + engine durante build de Next 16.
