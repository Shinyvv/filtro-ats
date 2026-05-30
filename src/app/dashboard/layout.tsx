import { DashboardHeader } from "@/components/dashboard/header";
import { Sidebar } from "@/components/dashboard/sidebar";
import { requireUser } from "@/lib/auth/auth";
import type { ReactNode } from "react";

import { logoutAction } from "./actions";

type DashboardLayoutProps = {
  children: ReactNode;
};

export default async function DashboardLayout({
  children,
}: DashboardLayoutProps) {
  const user = await requireUser();

  return (
    <div className="min-h-screen md:flex">
      <Sidebar />
      <section className="flex min-h-screen flex-1 flex-col">
        <DashboardHeader userName={user.name} onLogout={logoutAction} />
        <main className="flex-1 p-6">{children}</main>
      </section>
    </div>
  );
}

