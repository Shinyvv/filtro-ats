-- AlterEnum
ALTER TYPE "CandidateStatus" ADD VALUE IF NOT EXISTS 'HIRED';

-- AlterTable
ALTER TABLE "Candidate" ADD COLUMN "internalNotes" TEXT;
