import { readFile, stat } from "node:fs/promises";
import path from "node:path";

import { requireUser } from "@/lib/auth/auth";
import { getCompanyIdForUser } from "@/lib/company";
import { prisma } from "@/lib/prisma/prisma";

type CandidateCvRouteProps = {
  params: Promise<{ id: string }> | { id: string };
};

function notFoundResponse(): Response {
  return new Response("Not found", { status: 404 });
}

function isPathInside(basePath: string, targetPath: string): boolean {
  const relativePath = path.relative(basePath, targetPath);
  return Boolean(relativePath) && !relativePath.startsWith("..") && !path.isAbsolute(relativePath);
}

function getFileExtension(mimeType: string, fileName: string): string {
  if (mimeType === "application/pdf") {
    return "pdf";
  }

  if (
    mimeType ===
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "docx";
  }

  const extension = path.extname(fileName).replace(".", "").toLowerCase();
  return extension || "cv";
}

function getSafeFileNameSegment(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function getCandidateDownloadName(candidate: {
  fullName: string;
  email: string;
  cvFileName: string;
  cvMimeType: string;
}): string {
  const fullName = getSafeFileNameSegment(candidate.fullName);
  const email = getSafeFileNameSegment(candidate.email);
  const extension = getFileExtension(candidate.cvMimeType, candidate.cvFileName);
  const baseName = [fullName, email].filter(Boolean).join("_");

  return `${baseName || "cv"}.${extension}`;
}

export async function GET(
  _request: Request,
  { params }: CandidateCvRouteProps,
): Promise<Response> {
  const resolvedParams = await params;
  const user = await requireUser();
  const companyId = await getCompanyIdForUser(user);

  const candidate = await prisma.candidate.findFirst({
    where: {
      id: resolvedParams.id,
    },
    select: {
      fullName: true,
      email: true,
      cvFilePath: true,
      cvFileName: true,
      cvMimeType: true,
      job: {
        select: {
          companyId: true,
        },
      },
    },
  });

  if (!candidate || candidate.job.companyId !== companyId) {
    return notFoundResponse();
  }

  if (!candidate.cvFilePath || !candidate.cvFileName || !candidate.cvMimeType) {
    return notFoundResponse();
  }

  const uploadRoot = path.resolve(process.cwd(), "uploads", "cvs");
  const resolvedFilePath = path.resolve(candidate.cvFilePath);

  if (!isPathInside(uploadRoot, resolvedFilePath)) {
    return notFoundResponse();
  }

  try {
    const fileStat = await stat(resolvedFilePath);
    if (!fileStat.isFile()) {
      return notFoundResponse();
    }

    const file = await readFile(resolvedFilePath);
    const safeFileName = getCandidateDownloadName(candidate);

    return new Response(new Uint8Array(file), {
      headers: {
        "Content-Type": candidate.cvMimeType,
        "Content-Disposition": `attachment; filename="${safeFileName}"`,
      },
    });
  } catch {
    return notFoundResponse();
  }
}
