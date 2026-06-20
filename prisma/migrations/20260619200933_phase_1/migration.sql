/*
  Warnings:

  - The values [EVENT,FUND,DIRECTORY,ELECTION] on the enum `AuditEntityType` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "AuditEntityType_new" AS ENUM ('AUTH', 'MEMBER', 'USER_ACCOUNT', 'FAMILY_RELATIONSHIP', 'BULK_IMPORT', 'SYSTEM');
ALTER TABLE "AuditLog" ALTER COLUMN "entityType" TYPE "AuditEntityType_new" USING ("entityType"::text::"AuditEntityType_new");
ALTER TYPE "AuditEntityType" RENAME TO "AuditEntityType_old";
ALTER TYPE "AuditEntityType_new" RENAME TO "AuditEntityType";
DROP TYPE "AuditEntityType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "UserAccount" DROP CONSTRAINT "UserAccount_memberId_fkey";

-- AlterTable
ALTER TABLE "Member" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "BulkImportBatch" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "totalRows" INTEGER NOT NULL,
    "successRows" INTEGER NOT NULL,
    "failedRows" INTEGER NOT NULL,
    "createdById" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BulkImportBatch_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BulkImportBatch_type_idx" ON "BulkImportBatch"("type");

-- CreateIndex
CREATE INDEX "BulkImportBatch_createdAt_idx" ON "BulkImportBatch"("createdAt");

-- CreateIndex
CREATE INDEX "FamilyRelationship_fromMemberId_type_idx" ON "FamilyRelationship"("fromMemberId", "type");

-- CreateIndex
CREATE INDEX "FamilyRelationship_toMemberId_type_idx" ON "FamilyRelationship"("toMemberId", "type");

-- CreateIndex
CREATE INDEX "Member_city_idx" ON "Member"("city");

-- CreateIndex
CREATE INDEX "Member_phone_idx" ON "Member"("phone");

-- AddForeignKey
ALTER TABLE "UserAccount" ADD CONSTRAINT "UserAccount_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
