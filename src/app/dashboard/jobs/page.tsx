import Link from "next/link";
import { CandidateStatus, JobStatus } from "@prisma/client";

import { JobTable } from "@/components/jobs/job-table";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";

export const dynamic = "force-dynamic";

function getJobStatusRank(status: JobStatus): number {
  switch (status) {
    case JobStatus.ACTIVE:
      return 0;
    case JobStatus.DRAFT:
      return 1;
    case JobStatus.CLOSED:
      return 2;
  }
}

export default async function JobsPage() {
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const [jobs, newCandidatesByJob] = await Promise.all([
    prisma.job.findMany({
      where: { companyId },
      select: {
        id: true,
        title: true,
        status: true,
        createdAt: true,
        _count: {
          select: { candidates: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    }),
    prisma.candidate.groupBy({
      by: ["jobId"],
      where: {
        status: CandidateStatus.NEW,
        job: {
          companyId,
        },
      },
      _count: {
        _all: true,
      },
    }),
  ]);

  const newCandidatesCountByJobId = new Map(
    newCandidatesByJob.map((item) => [item.jobId, item._count._all]),
  );

  const jobsForTable = jobs
    .map((job) => ({
      id: job.id,
      title: job.title,
      status: job.status,
      createdAt: job.createdAt.toISOString(),
      _count: job._count,
      newCandidatesCount: newCandidatesCountByJobId.get(job.id) ?? 0,
    }))
    .sort((firstJob, secondJob) => {
      const statusRankDifference =
        getJobStatusRank(firstJob.status) - getJobStatusRank(secondJob.status);

      if (statusRankDifference !== 0) {
        return statusRankDifference;
      }

      return (
        new Date(secondJob.createdAt).getTime() -
        new Date(firstJob.createdAt).getTime()
      );
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
          <JobTable jobs={jobsForTable} />
        </CardContent>
      </Card>
    </div>
  );
}

