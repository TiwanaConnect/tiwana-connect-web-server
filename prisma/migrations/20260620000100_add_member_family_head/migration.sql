-- AlterTable
ALTER TABLE "Member" ADD COLUMN "isFamilyHead" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "Member_isFamilyHead_idx" ON "Member"("isFamilyHead");
