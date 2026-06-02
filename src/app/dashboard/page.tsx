import Link from "next/link";
import { JobStatus, CandidateStatus } from "@prisma/client";

import { StatCard } from "@/components/dashboard/stat-card";
import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const [totalJobs, activeJobs, totalCandidates, newCandidates] = await Promise.all([
    prisma.job.count({ where: { companyId } }),
    prisma.job.count({ where: { companyId, status: JobStatus.ACTIVE } }),
    prisma.candidate.count({
      where: {
        job: {
          companyId,
        },
      },
    }),
    prisma.candidate.count({
      where: {
        status: CandidateStatus.NEW,
        job: {
          companyId,
        },
      },
    }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Dashboard</h1>
          <p className="text-zinc-600">Resumen rapido del sistema ATS.</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
        >
          Crear oferta
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total ofertas" value={totalJobs} />
        <StatCard title="Ofertas activas" value={activeJobs} />
        <StatCard title="Total postulantes" value={totalCandidates} />
        <StatCard title="Postulantes nuevos" value={newCandidates} />
      </div>
    </div>
  );
}

