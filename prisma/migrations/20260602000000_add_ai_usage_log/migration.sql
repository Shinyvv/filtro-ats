-- CreateTable
CREATE TABLE "AiUsageLog" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "userId" TEXT,
    "companyId" TEXT,
    "jobId" TEXT,
    "candidateId" TEXT,
    "ip" TEXT,
    "model" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "inputChars" INTEGER NOT NULL DEFAULT 0,
    "outputChars" INTEGER NOT NULL DEFAULT 0,
    "cvWasTruncated" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL,
    "errorMessage" TEXT,

    CONSTRAINT "AiUsageLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AiUsageLog_createdAt_idx" ON "AiUsageLog"("createdAt");

-- CreateIndex
CREATE INDEX "AiUsageLog_jobId_createdAt_idx" ON "AiUsageLog"("jobId", "createdAt");
