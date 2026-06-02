import Link from "next/link";
import { notFound } from "next/navigation";

import { CandidateDetailCard } from "@/components/candidates/candidate-detail-card";
import { CandidateStatusSelect } from "@/components/candidates/candidate-status-select";
import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";

import { updateCandidateStatusAction } from "./actions";

export const dynamic = "force-dynamic";

type CandidateDetailPageProps = {
  params: Promise<{ id: string }> | { id: string };
};

export default async function CandidateDetailPage({
  params,
}: CandidateDetailPageProps) {
  const resolvedParams = await params;
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const candidate = await prisma.candidate.findFirst({
    where: {
      id: resolvedParams.id,
      job: {
        companyId,
      },
    },
    include: {
      job: {
        select: {
          id: true,
          title: true,
        },
      },
    },
  });

  if (!candidate) {
    notFound();
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-zinc-900">Detalle postulante</h1>
          <p className="text-zinc-600">{candidate.fullName}</p>
        </div>
        <Link
          href={`/dashboard/jobs/${candidate.jobId}/candidates`}
          className="inline-flex h-10 items-center justify-center rounded-md border border-zinc-300 bg-white px-4 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          Volver a postulantes
        </Link>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_320px]">
        <CandidateDetailCard candidate={candidate} />
        <CandidateStatusSelect
          candidateId={candidate.id}
          currentStatus={candidate.status}
          action={updateCandidateStatusAction}
        />
      </div>
    </div>
  );
}

