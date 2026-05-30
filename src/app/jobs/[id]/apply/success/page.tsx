import Link from "next/link";

export default function ApplySuccessPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-10">
      <div className="w-full rounded-xl border border-zinc-200 bg-white p-8 text-center">
        <h1 className="text-2xl font-semibold text-zinc-900">Postulacion enviada</h1>
        <p className="mt-2 text-zinc-600">
          Gracias por postular. El equipo de RRHH revisara tu informacion pronto.
        </p>
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

