import Link from "next/link";
import { notFound } from "next/navigation";

import { CandidateTable } from "@/components/candidates/candidate-table";
import { Card, CardContent } from "@/components/ui/card";
import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";

type JobCandidatesPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function JobCandidatesPage({
  params,
}: JobCandidatesPageProps) {
  const resolvedParams = await params;
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

  const candidates = await prisma.candidate.findMany({
    where: { jobId: job.id },
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
    },
  });

  return (
    <div className="space-y-4">
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
          <CandidateTable candidates={candidates} />
        </CardContent>
      </Card>
    </div>
  );
}

