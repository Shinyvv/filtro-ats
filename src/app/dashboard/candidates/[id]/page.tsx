import Link from "next/link";
import { notFound } from "next/navigation";

import { CandidateDetailCard } from "@/components/candidates/candidate-detail-card";
import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";

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
    select: {
      id: true,
      fullName: true,
      email: true,
      phone: true,
      currentPosition: true,
      yearsOfExperience: true,
      expectedSalary: true,
      availability: true,
      cvText: true,
      cvFileName: true,
      cvMimeType: true,
      internalNotes: true,
      aiSummary: true,
      aiScore: true,
      status: true,
      createdAt: true,
      jobId: true,
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

      <CandidateDetailCard candidate={candidate} />
    </div>
  );
}

