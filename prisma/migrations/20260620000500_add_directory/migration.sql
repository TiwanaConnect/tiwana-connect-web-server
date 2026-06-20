ALTER TYPE "AuditEntityType" ADD VALUE 'DIRECTORY';
ALTER TYPE "AuditEntityType" ADD VALUE 'MEMBER_TAG';
ALTER TYPE "AuditEntityType" ADD VALUE 'HELP_REQUEST';

CREATE TYPE "DirectoryVisibility" AS ENUM ('VISIBLE', 'HIDDEN', 'LIMITED');
CREATE TYPE "MemberTagType" AS ENUM ('SKILL', 'PROFESSION', 'CITY', 'FAMILY_BRANCH', 'INTEREST', 'SERVICE', 'OTHER');
CREATE TYPE "HelpRequestStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "HelpRequestPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');

CREATE TABLE "MemberDirectorySetting" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "visibility" "DirectoryVisibility" NOT NULL DEFAULT 'VISIBLE',
  "showPhone" BOOLEAN NOT NULL DEFAULT false,
  "showCity" BOOLEAN NOT NULL DEFAULT true,
  "showProfession" BOOLEAN NOT NULL DEFAULT true,
  "allowHelpRequests" BOOLEAN NOT NULL DEFAULT true,
  "bio" TEXT,
  "availabilityNote" TEXT,
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MemberDirectorySetting_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberTag" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "type" "MemberTagType" NOT NULL DEFAULT 'OTHER',
  "description" TEXT,
  "color" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "MemberTag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberTagAssignment" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  "assignedById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MemberTagAssignment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MemberHelpRequest" (
  "id" TEXT NOT NULL,
  "fromMemberId" TEXT NOT NULL,
  "toMemberId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "category" TEXT,
  "priority" "HelpRequestPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "HelpRequestStatus" NOT NULL DEFAULT 'PENDING',
  "responseMessage" TEXT,
  "respondedAt" TIMESTAMP(3),
  "completedAt" TIMESTAMP(3),
  "cancelledAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "MemberHelpRequest_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "MemberDirectorySetting_memberId_key" ON "MemberDirectorySetting"("memberId");
CREATE INDEX "MemberDirectorySetting_visibility_idx" ON "MemberDirectorySetting"("visibility");
CREATE UNIQUE INDEX "MemberTag_slug_key" ON "MemberTag"("slug");
CREATE INDEX "MemberTag_type_idx" ON "MemberTag"("type");
CREATE INDEX "MemberTag_isActive_idx" ON "MemberTag"("isActive");
CREATE UNIQUE INDEX "MemberTagAssignment_memberId_tagId_key" ON "MemberTagAssignment"("memberId", "tagId");
CREATE INDEX "MemberTagAssignment_memberId_idx" ON "MemberTagAssignment"("memberId");
CREATE INDEX "MemberTagAssignment_tagId_idx" ON "MemberTagAssignment"("tagId");
CREATE INDEX "MemberHelpRequest_fromMemberId_idx" ON "MemberHelpRequest"("fromMemberId");
CREATE INDEX "MemberHelpRequest_toMemberId_idx" ON "MemberHelpRequest"("toMemberId");
CREATE INDEX "MemberHelpRequest_status_idx" ON "MemberHelpRequest"("status");
CREATE INDEX "MemberHelpRequest_priority_idx" ON "MemberHelpRequest"("priority");
CREATE INDEX "MemberHelpRequest_createdAt_idx" ON "MemberHelpRequest"("createdAt");
CREATE INDEX "MemberHelpRequest_deletedAt_idx" ON "MemberHelpRequest"("deletedAt");

ALTER TABLE "MemberDirectorySetting" ADD CONSTRAINT "MemberDirectorySetting_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberTagAssignment" ADD CONSTRAINT "MemberTagAssignment_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberTagAssignment" ADD CONSTRAINT "MemberTagAssignment_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "MemberTag"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberHelpRequest" ADD CONSTRAINT "MemberHelpRequest_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MemberHelpRequest" ADD CONSTRAINT "MemberHelpRequest_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
