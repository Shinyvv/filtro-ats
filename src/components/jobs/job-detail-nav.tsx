"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

type JobDetailNavProps = {
  jobId: string;
};

export function JobDetailNav({ jobId }: JobDetailNavProps) {
  const pathname = usePathname();
  const baseHref = `/dashboard/jobs/${jobId}`;

  const tabs = [
    {
      label: "Resumen",
      href: baseHref,
      isActive: pathname === baseHref,
    },
    {
      label: "Postulantes",
      href: `${baseHref}/candidates`,
      isActive: pathname.startsWith(`${baseHref}/candidates`),
    },
  ];

  return (
    <div className="space-y-3">
      <Link
        href="/dashboard/jobs"
        className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 transition-colors hover:text-zinc-900"
      >
        <span aria-hidden="true">←</span>
        Volver a ofertas
      </Link>

      <nav aria-label="Navegación de oferta" className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={tab.isActive ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium transition-colors",
              tab.isActive
                ? "bg-zinc-900 text-zinc-50"
                : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900",
            )}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
