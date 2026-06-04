import Link from "next/link";

type ApplySuccessPageProps = {
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export default async function ApplySuccessPage({
  searchParams,
}: ApplySuccessPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const duplicateValue = resolvedSearchParams.duplicate;
  const duplicate =
    (Array.isArray(duplicateValue) ? duplicateValue[0] : duplicateValue) === "1";

  const title = duplicate ? "Ya tenemos tu postulacion" : "Postulacion enviada";
  const message = duplicate
    ? "Ya existe una postulacion registrada con este correo para esta oferta."
    : "Tu postulacion fue enviada correctamente. El equipo de reclutamiento podra revisar tu informacion.";

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10">
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">{title}</h1>
        <p className="mt-2 text-zinc-600">{message}</p>
        <Link
          href="/"
          className="mt-6 inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
        >
          Volver al inicio
        </Link>
      </div>
    </main>
  );
}
