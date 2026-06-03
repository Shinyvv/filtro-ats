import Link from "next/link";
import type { CandidateStatus, Prisma } from "@prisma/client";
import { notFound } from "next/navigation";

import { CandidateTable } from "@/components/candidates/candidate-table";
import { JobDetailNav } from "@/components/jobs/job-detail-nav";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";
import { candidateFiltersSchema } from "@/lib/validations/candidate.schema";

export const dynamic = "force-dynamic";

type JobCandidatesPageProps = {
  params: Promise<{ id: string }> | { id: string };
  searchParams?:
    | Promise<{ status?: string; q?: string }>
    | { status?: string; q?: string };
};

export default async function JobCandidatesPage({
  params,
  searchParams,
}: JobCandidatesPageProps) {
  const resolvedParams = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const job = await prisma.job.findFirst({
    where: {
      id: resolvedParams.id,
      companyId,
    },
    select: {
      id: true,
      title: true,
    },
  });

  if (!job) {
    notFound();
  }

  const parsedFilters = candidateFiltersSchema.safeParse({
    status: resolvedSearchParams.status || undefined,
    q: resolvedSearchParams.q || undefined,
  });
  const filters = parsedFilters.success ? parsedFilters.data : {};
  const currentStatus = filters.status;
  const currentQuery = filters.q;

  const candidateWhere: Prisma.CandidateWhereInput = {
    jobId: job.id,
    ...(currentStatus ? { status: currentStatus } : {}),
    ...(currentQuery
      ? {
          OR: [
            { fullName: { contains: currentQuery, mode: "insensitive" } },
            { email: { contains: currentQuery, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const candidates = await prisma.candidate.findMany({
    where: candidateWhere,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      yearsOfExperience: true,
      aiScore: true,
      status: true,
      createdAt: true,
      cvFileName: true,
    },
  });

  return (
    <div className="space-y-4">
      <JobDetailNav jobId={job.id} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Postulantes</h1>
          <p className="text-zinc-600">{job.title}</p>
        </div>
        <Link
          href={`/dashboard/jobs/${job.id}`}
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Volver a oferta
        </Link>
      </div>

      <Card>
        <CardContent className="p-0">
          <CandidateTable
            candidates={candidates}
            jobId={job.id}
            currentStatus={currentStatus as CandidateStatus | undefined}
            currentQuery={currentQuery}
          />
        </CardContent>
      </Card>
    </div>
  );
}

