import Link from "next/link";

import { JobTable } from "@/components/jobs/job-table";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";

export const dynamic = "force-dynamic";

export default async function JobsPage() {
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const jobs = await prisma.job.findMany({
    where: { companyId },
    include: {
      _count: {
        select: { candidates: true },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Ofertas laborales</h1>
          <p className="text-zinc-600">Crea y gestiona vacantes del equipo.</p>
        </div>
        <Link
          href="/dashboard/jobs/new"
          className="inline-flex h-10 items-center justify-center rounded-md bg-zinc-900 px-4 text-sm font-medium text-zinc-50 hover:bg-zinc-800"
        >
          Nueva oferta
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <JobTable jobs={jobs} />
        </CardContent>
      </Card>
    </div>
  );
}

