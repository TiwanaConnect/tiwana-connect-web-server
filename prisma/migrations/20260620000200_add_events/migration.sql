-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('FAMILY_EVENT', 'OFFICIAL_MEETING', 'WEDDING', 'EID_GATHERING', 'REUNION', 'OTHER');

-- CreateEnum
CREATE TYPE "EventStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'CANCELLED', 'COMPLETED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('ALL_FAMILY', 'INVITED_ONLY', 'BRANCH_ONLY');

-- CreateEnum
CREATE TYPE "RSVPStatus" AS ENUM ('PENDING', 'GOING', 'MAYBE', 'NOT_GOING');

-- CreateEnum
CREATE TYPE "EventInviteSource" AS ENUM ('MANUAL', 'ALL_FAMILY', 'BRANCH', 'FAMILY_HEAD');

-- AlterEnum
ALTER TYPE "AuditEntityType" ADD VALUE 'EVENT';

-- CreateTable
CREATE TABLE "FamilyEvent" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" "EventType" NOT NULL DEFAULT 'FAMILY_EVENT',
    "status" "EventStatus" NOT NULL DEFAULT 'PUBLISHED',
    "visibility" "EventVisibility" NOT NULL DEFAULT 'INVITED_ONLY',
    "isOfficial" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3),
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Karachi',
    "locationName" TEXT,
    "locationAddress" TEXT,
    "mapUrl" TEXT,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancelledById" TEXT,
    "cancelReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "FamilyEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EventInvite" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "source" "EventInviteSource" NOT NULL DEFAULT 'MANUAL',
    "rsvpStatus" "RSVPStatus" NOT NULL DEFAULT 'PENDING',
    "rsvpNote" TEXT,
    "respondedAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "invitedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "EventInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FamilyEvent_status_idx" ON "FamilyEvent"("status");
CREATE INDEX "FamilyEvent_type_idx" ON "FamilyEvent"("type");
CREATE INDEX "FamilyEvent_isOfficial_idx" ON "FamilyEvent"("isOfficial");
CREATE INDEX "FamilyEvent_isPinned_idx" ON "FamilyEvent"("isPinned");
CREATE INDEX "FamilyEvent_startAt_idx" ON "FamilyEvent"("startAt");
CREATE INDEX "FamilyEvent_createdById_idx" ON "FamilyEvent"("createdById");
CREATE INDEX "FamilyEvent_deletedAt_idx" ON "FamilyEvent"("deletedAt");
CREATE UNIQUE INDEX "EventInvite_eventId_memberId_key" ON "EventInvite"("eventId", "memberId");
CREATE INDEX "EventInvite_eventId_idx" ON "EventInvite"("eventId");
CREATE INDEX "EventInvite_memberId_idx" ON "EventInvite"("memberId");
CREATE INDEX "EventInvite_rsvpStatus_idx" ON "EventInvite"("rsvpStatus");
CREATE INDEX "EventInvite_source_idx" ON "EventInvite"("source");

-- AddForeignKey
ALTER TABLE "FamilyEvent" ADD CONSTRAINT "FamilyEvent_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "EventInvite" ADD CONSTRAINT "EventInvite_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "FamilyEvent"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "EventInvite" ADD CONSTRAINT "EventInvite_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
