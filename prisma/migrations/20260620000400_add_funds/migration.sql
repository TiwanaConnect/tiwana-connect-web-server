-- CreateEnum
CREATE TYPE "FundType" AS ENUM ('FAMILY_GENERAL', 'ZAKAT', 'SADAQAH', 'EVENT', 'PARTY', 'EMERGENCY', 'MEMBER_HELP', 'OTHER');
CREATE TYPE "FundStatus" AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED', 'CANCELLED', 'ARCHIVED');
CREATE TYPE "FundVisibility" AS ENUM ('ALL_FAMILY', 'INVITED_ONLY', 'ADMIN_ONLY');
CREATE TYPE "FundTransactionType" AS ENUM ('CONTRIBUTION', 'ZAKAT_INCOME', 'SADAQAH_INCOME', 'EXPENSE', 'DISBURSEMENT', 'REFUND', 'ADJUSTMENT');
CREATE TYPE "FundTransactionStatus" AS ENUM ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED');
CREATE TYPE "ContributionRequestStatus" AS ENUM ('PENDING', 'PAID', 'PARTIALLY_PAID', 'WAIVED', 'CANCELLED');
CREATE TYPE "FundPaymentMethod" AS ENUM ('CASH', 'BANK_TRANSFER', 'EASYPAISA', 'JAZZCASH', 'OTHER');

ALTER TYPE "AuditEntityType" ADD VALUE 'FUND';

CREATE TABLE "FamilyFund" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "type" "FundType" NOT NULL DEFAULT 'FAMILY_GENERAL',
  "status" "FundStatus" NOT NULL DEFAULT 'ACTIVE',
  "visibility" "FundVisibility" NOT NULL DEFAULT 'ALL_FAMILY',
  "targetAmount" DECIMAL(12,2),
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "isOfficial" BOOLEAN NOT NULL DEFAULT false,
  "isPinned" BOOLEAN NOT NULL DEFAULT false,
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "createdById" TEXT NOT NULL,
  "updatedById" TEXT,
  "relatedEventId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "FamilyFund_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FundContributionRequest" (
  "id" TEXT NOT NULL,
  "fundId" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "requestedAmount" DECIMAL(12,2),
  "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "status" "ContributionRequestStatus" NOT NULL DEFAULT 'PENDING',
  "requestedById" TEXT,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "FundContributionRequest_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FundTransaction" (
  "id" TEXT NOT NULL,
  "fundId" TEXT NOT NULL,
  "type" "FundTransactionType" NOT NULL,
  "status" "FundTransactionStatus" NOT NULL DEFAULT 'PENDING',
  "amount" DECIMAL(12,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'PKR',
  "contributorId" TEXT,
  "recipientMemberId" TEXT,
  "paymentMethod" "FundPaymentMethod",
  "referenceNumber" TEXT,
  "note" TEXT,
  "recordedById" TEXT,
  "confirmedById" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "rejectedById" TEXT,
  "rejectedAt" TIMESTAMP(3),
  "rejectReason" TEXT,
  "requestId" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "FundTransaction_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "FamilyFund_type_idx" ON "FamilyFund"("type");
CREATE INDEX "FamilyFund_status_idx" ON "FamilyFund"("status");
CREATE INDEX "FamilyFund_visibility_idx" ON "FamilyFund"("visibility");
CREATE INDEX "FamilyFund_isOfficial_idx" ON "FamilyFund"("isOfficial");
CREATE INDEX "FamilyFund_isPinned_idx" ON "FamilyFund"("isPinned");
CREATE INDEX "FamilyFund_createdById_idx" ON "FamilyFund"("createdById");
CREATE INDEX "FamilyFund_relatedEventId_idx" ON "FamilyFund"("relatedEventId");
CREATE INDEX "FamilyFund_deletedAt_idx" ON "FamilyFund"("deletedAt");
CREATE UNIQUE INDEX "FundContributionRequest_fundId_memberId_key" ON "FundContributionRequest"("fundId","memberId");
CREATE INDEX "FundContributionRequest_fundId_idx" ON "FundContributionRequest"("fundId");
CREATE INDEX "FundContributionRequest_memberId_idx" ON "FundContributionRequest"("memberId");
CREATE INDEX "FundContributionRequest_status_idx" ON "FundContributionRequest"("status");
CREATE INDEX "FundTransaction_fundId_idx" ON "FundTransaction"("fundId");
CREATE INDEX "FundTransaction_type_idx" ON "FundTransaction"("type");
CREATE INDEX "FundTransaction_status_idx" ON "FundTransaction"("status");
CREATE INDEX "FundTransaction_contributorId_idx" ON "FundTransaction"("contributorId");
CREATE INDEX "FundTransaction_recipientMemberId_idx" ON "FundTransaction"("recipientMemberId");
CREATE INDEX "FundTransaction_recordedById_idx" ON "FundTransaction"("recordedById");
CREATE INDEX "FundTransaction_requestId_idx" ON "FundTransaction"("requestId");
CREATE INDEX "FundTransaction_createdAt_idx" ON "FundTransaction"("createdAt");

ALTER TABLE "FamilyFund" ADD CONSTRAINT "FamilyFund_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "FundContributionRequest" ADD CONSTRAINT "FundContributionRequest_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "FamilyFund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FundContributionRequest" ADD CONSTRAINT "FundContributionRequest_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_fundId_fkey" FOREIGN KEY ("fundId") REFERENCES "FamilyFund"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_contributorId_fkey" FOREIGN KEY ("contributorId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_recipientMemberId_fkey" FOREIGN KEY ("recipientMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_recordedById_fkey" FOREIGN KEY ("recordedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "FundTransaction" ADD CONSTRAINT "FundTransaction_requestId_fkey" FOREIGN KEY ("requestId") REFERENCES "FundContributionRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
