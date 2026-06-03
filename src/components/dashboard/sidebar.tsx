"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Resumen" },
  { href: "/dashboard/jobs", label: "Ofertas" },
];

function isActivePath(pathname: string, href: string): boolean {
  if (href === "/dashboard") {
    return pathname === href;
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-full border-b border-zinc-200 bg-white md:w-64 md:border-b-0 md:border-r">
      <div className="px-6 py-5">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
          Filtro ATS
        </p>
        <p className="mt-1 text-lg font-semibold text-zinc-900">Panel RRHH</p>
      </div>
      <nav className="grid gap-1 px-3 pb-4">
        {items.map((item) => {
          const active = isActivePath(pathname, item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-md px-3 py-2 text-sm font-medium transition-colors",
                active ? "bg-zinc-900 text-zinc-50" : "text-zinc-700 hover:bg-zinc-100",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

