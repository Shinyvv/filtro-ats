# Handoff - Filtro ATS

Fecha: 2026-06-03

## Estado general

El proyecto es un MVP ATS con Next.js App Router, TypeScript, Prisma 7, PostgreSQL, Server Actions, shadcn-style UI local y pnpm. La app ya funciona sin depender de Gemini/GCP. La IA queda como paso opcional posterior a la creacion del candidato.

El flujo base actual permite:

- Crear, editar y cerrar ofertas.
- Publicar postulaciones solo para ofertas `ACTIVE`.
- Crear candidatos con CV PDF/DOCX.
- Guardar CV en storage local.
- Gestionar candidatos por oferta.
- Filtrar postulantes por estado.
- Buscar postulantes por nombre o email.
- Cambiar estado desde tabla y detalle.
- Guardar y limpiar notas internas.
- Descargar CV original desde tabla y detalle.

## Cambios implementados recientemente

### Datos y Prisma

- `CandidateStatus` incluye `HIRED`.
- `Candidate` incluye `internalNotes String?`.
- No se agrego `companyId` directo a `Candidate`.
- No se creo tabla `CandidateNote`.
- Migracion agregada:
  - `prisma/migrations/20260603165545_add_candidate_hired_internal_notes/migration.sql`

### Postulacion publica

- `src/app/jobs/[id]/apply/actions.ts` ahora busca ofertas solo con `status: ACTIVE`.
- Si una oferta no existe, esta cerrada o esta en draft, redirige con `error=closed`.
- El candidato se crea antes de cualquier evaluacion IA.
- La cuota/evaluacion/log de IA no bloquean la postulacion.
- Si IA falla, `aiScore` y `aiSummary` quedan `null`.

### Validaciones y helpers

- `src/lib/validations/candidate.schema.ts` incluye:
  - `candidateIdSchema`
  - `updateCandidateStatusSchema`
  - `updateCandidateInternalNotesSchema`
  - `candidateFiltersSchema`
- `src/lib/candidates/status.ts` centraliza:
  - `candidateStatusOptions`
  - `getCandidateStatusLabel`
  - `getCandidateStatusBadgeVariant`

### Acciones de candidatos

- `src/app/dashboard/candidates/actions.ts` contiene las acciones reutilizables:
  - `updateCandidateStatusAction(input)`
  - `updateCandidateInternalNotesAction(input)`
- Ambas validan:
  - input con Zod
  - sesion con `requireUser`
  - empresa via `Candidate -> Job -> Company`
- `src/app/dashboard/candidates/[id]/actions.ts` queda como wrapper compatible con formularios antiguos.

### Descarga de CV

- Ruta protegida:
  - `src/app/dashboard/candidates/[id]/cv/route.ts`
- Valida sesion y empresa.
- No expone rutas absolutas.
- Restringe lectura a `uploads/cvs`.
- El nombre descargado se genera con:
  - `Nombre_Apellido_email.pdf`
  - o `.docx` si el archivo original es DOCX.

### UI de gestion avanzada

- `src/app/dashboard/jobs/[id]/candidates/page.tsx`
  - Lee `searchParams`.
  - Valida filtros.
  - Aplica `status` y `q` en Prisma.
- `src/components/candidates/candidate-table.tsx`
  - Es Client Component.
  - Tiene filtros, busqueda, limpiar filtros, cambio de estado inline, detalle, descargar CV y copiar email.
- `src/components/candidates/candidate-status-select.tsx`
  - Soporta `variant="inline"` y `variant="card"`.
  - Llama la Server Action compartida.
  - Sincroniza estado local cuando cambia `currentStatus`.
- `src/app/dashboard/candidates/[id]/page.tsx`
  - Selecciona explicitamente los datos del candidato.
- `src/components/candidates/candidate-detail-card.tsx`
  - Muestra datos del candidato, estado editable, acciones rapidas, notas internas, CV original, score/resumen IA y texto extraido.

## Archivos clave

- `prisma/schema.prisma`
- `src/app/jobs/[id]/apply/actions.ts`
- `src/app/dashboard/jobs/[id]/candidates/page.tsx`
- `src/app/dashboard/candidates/actions.ts`
- `src/app/dashboard/candidates/[id]/page.tsx`
- `src/app/dashboard/candidates/[id]/cv/route.ts`
- `src/components/candidates/candidate-table.tsx`
- `src/components/candidates/candidate-status-select.tsx`
- `src/components/candidates/candidate-detail-card.tsx`
- `src/lib/validations/candidate.schema.ts`
- `src/lib/candidates/status.ts`

## Seguridad y aislamiento multiempresa

El aislamiento sigue usando `Candidate -> Job -> Company`.

Las acciones y la descarga de CV no confian solo en IDs recibidos desde cliente. Validan que `candidate.job.companyId === companyId` antes de actualizar o descargar.

`src/lib/company.ts` mantiene un fallback MVP/demo a la primera empresa cuando `user.companyId` es null. Ese fallback esta documentado como riesgo y no debe tratarse como frontera de seguridad futura.

## Riesgos pendientes

- Resolver formalmente multiempresa cuando haya mas de una empresa real y usuarios sin `companyId`.
- El storage local depende de que el archivo fisico exista en `uploads/cvs`.
- Si se guarda el archivo y falla la creacion del candidato por un error no duplicado, puede quedar un archivo huerfano.
- El flujo IA sigue presente como fallback/mock opcional, pero no es parte del producto base actual.
- Revisar o reemplazar el script de lint si se quiere una validacion automatica ademas de TypeScript.
