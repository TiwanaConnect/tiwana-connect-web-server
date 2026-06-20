-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUPER_ADMIN', 'PRESIDENT', 'MEMBER');

-- CreateEnum
CREATE TYPE "MemberGender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "VisibilityStatus" AS ENUM ('VISIBLE', 'HIDDEN');

-- CreateEnum
CREATE TYPE "MemberStatus" AS ENUM ('ACTIVE', 'BLOCKED', 'PENDING');

-- CreateEnum
CREATE TYPE "AuditEntityType" AS ENUM ('AUTH', 'MEMBER', 'FAMILY_RELATIONSHIP', 'EVENT', 'FUND', 'DIRECTORY', 'ELECTION', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FamilyRelationshipType" AS ENUM ('FATHER', 'MOTHER', 'SPOUSE', 'CHILD', 'SIBLING', 'GUARDIAN', 'OTHER');

-- CreateTable
CREATE TABLE "UserAccount" (
    "id" TEXT NOT NULL,
    "memberId" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'MEMBER',
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Member" (
    "id" TEXT NOT NULL,
    "fullName" TEXT,
    "alias" TEXT,
    "initials" TEXT NOT NULL,
    "gender" "MemberGender" NOT NULL,
    "visibility" "VisibilityStatus" NOT NULL DEFAULT 'VISIBLE',
    "status" "MemberStatus" NOT NULL DEFAULT 'PENDING',
    "city" TEXT,
    "profession" TEXT,
    "phone" TEXT,
    "branchLabel" TEXT,
    "dateOfBirth" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Member_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyRelationship" (
    "id" TEXT NOT NULL,
    "fromMemberId" TEXT NOT NULL,
    "toMemberId" TEXT NOT NULL,
    "type" "FamilyRelationshipType" NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyRelationship_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL,
    "actorMemberId" TEXT,
    "action" TEXT NOT NULL,
    "entityType" "AuditEntityType" NOT NULL,
    "entityId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AppSetting" (
    "id" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AppSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_memberId_key" ON "UserAccount"("memberId");

-- CreateIndex
CREATE UNIQUE INDEX "UserAccount_username_key" ON "UserAccount"("username");

-- CreateIndex
CREATE INDEX "UserAccount_role_idx" ON "UserAccount"("role");

-- CreateIndex
CREATE INDEX "UserAccount_isActive_idx" ON "UserAccount"("isActive");

-- CreateIndex
CREATE INDEX "Member_gender_idx" ON "Member"("gender");

-- CreateIndex
CREATE INDEX "Member_visibility_idx" ON "Member"("visibility");

-- CreateIndex
CREATE INDEX "Member_status_idx" ON "Member"("status");

-- CreateIndex
CREATE INDEX "Member_branchLabel_idx" ON "Member"("branchLabel");

-- CreateIndex
CREATE INDEX "Member_deletedAt_idx" ON "Member"("deletedAt");

-- CreateIndex
CREATE INDEX "FamilyRelationship_fromMemberId_idx" ON "FamilyRelationship"("fromMemberId");

-- CreateIndex
CREATE INDEX "FamilyRelationship_toMemberId_idx" ON "FamilyRelationship"("toMemberId");

-- CreateIndex
CREATE INDEX "FamilyRelationship_type_idx" ON "FamilyRelationship"("type");

-- CreateIndex
CREATE UNIQUE INDEX "FamilyRelationship_fromMemberId_toMemberId_type_key" ON "FamilyRelationship"("fromMemberId", "toMemberId", "type");

-- CreateIndex
CREATE INDEX "AuditLog_actorMemberId_idx" ON "AuditLog"("actorMemberId");

-- CreateIndex
CREATE INDEX "AuditLog_entityType_idx" ON "AuditLog"("entityType");

-- CreateIndex
CREATE INDEX "AuditLog_entityId_idx" ON "AuditLog"("entityId");

-- CreateIndex
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "AppSetting_key_key" ON "AppSetting"("key");

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyRelationship" ADD CONSTRAINT "FamilyRelationship_fromMemberId_fkey" FOREIGN KEY ("fromMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FamilyRelationship" ADD CONSTRAINT "FamilyRelationship_toMemberId_fkey" FOREIGN KEY ("toMemberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditLog" ADD CONSTRAINT "AuditLog_actorMemberId_fkey" FOREIGN KEY ("actorMemberId") REFERENCES "Member"("id") ON DELETE SET NULL ON UPDATE CASCADE;
