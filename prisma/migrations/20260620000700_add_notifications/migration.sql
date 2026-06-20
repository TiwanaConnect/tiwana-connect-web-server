CREATE TYPE "PushProvider" AS ENUM ('EXPO', 'FCM', 'APNS');
CREATE TYPE "PushPlatform" AS ENUM ('IOS', 'ANDROID', 'WEB', 'UNKNOWN');
CREATE TYPE "PushDeliveryStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'FAILED', 'DEVICE_NOT_REGISTERED', 'SKIPPED');
CREATE TYPE "NotificationType" AS ENUM ('ANNOUNCEMENT', 'EVENT_INVITE', 'EVENT_UPDATED', 'EVENT_CANCELLED', 'EVENT_RSVP', 'FUND_REQUEST', 'FUND_CONTRIBUTION', 'FUND_TRANSACTION_CONFIRMED', 'FUND_TRANSACTION_REJECTED', 'HELP_REQUEST', 'HELP_REQUEST_RESPONSE', 'ELECTION_NOMINATION', 'ELECTION_NOMINATION_APPROVED', 'ELECTION_NOMINATION_REJECTED', 'ELECTION_CANDIDATE_ANNOUNCED', 'ELECTION_VOTING_OPEN', 'ELECTION_RESULT_ANNOUNCED', 'PRESIDENT_CEREMONY', 'SYSTEM');
CREATE TYPE "NotificationPriority" AS ENUM ('LOW', 'NORMAL', 'HIGH', 'URGENT');
CREATE TYPE "NotificationStatus" AS ENUM ('UNREAD', 'READ', 'ARCHIVED');

ALTER TYPE "ElectionAuditAction" ADD VALUE IF NOT EXISTS 'VOTING_OPENED';

CREATE TABLE "Notification" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "priority" "NotificationPriority" NOT NULL DEFAULT 'NORMAL',
  "status" "NotificationStatus" NOT NULL DEFAULT 'UNREAD',
  "title" TEXT NOT NULL,
  "body" TEXT,
  "actionLabel" TEXT,
  "actionUrl" TEXT,
  "entityType" TEXT,
  "entityId" TEXT,
  "readAt" TIMESTAMP(3),
  "archivedAt" TIMESTAMP(3),
  "metadata" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DevicePushToken" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "provider" "PushProvider" NOT NULL DEFAULT 'EXPO',
  "platform" "PushPlatform" NOT NULL DEFAULT 'UNKNOWN',
  "deviceId" TEXT,
  "deviceName" TEXT,
  "isActive" BOOLEAN NOT NULL DEFAULT true,
  "lastSeenAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "DevicePushToken_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PushDelivery" (
  "id" TEXT NOT NULL,
  "notificationId" TEXT,
  "memberId" TEXT NOT NULL,
  "pushTokenId" TEXT,
  "provider" "PushProvider" NOT NULL DEFAULT 'EXPO',
  "status" "PushDeliveryStatus" NOT NULL DEFAULT 'PENDING',
  "title" TEXT NOT NULL,
  "body" TEXT,
  "data" JSONB,
  "providerTicketId" TEXT,
  "providerReceiptId" TEXT,
  "providerError" TEXT,
  "sentAt" TIMESTAMP(3),
  "deliveredAt" TIMESTAMP(3),
  "failedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PushDelivery_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "NotificationPreference" (
  "id" TEXT NOT NULL,
  "memberId" TEXT NOT NULL,
  "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
  "announcementsPush" BOOLEAN NOT NULL DEFAULT true,
  "eventInvitesPush" BOOLEAN NOT NULL DEFAULT true,
  "fundsPush" BOOLEAN NOT NULL DEFAULT true,
  "helpRequestsPush" BOOLEAN NOT NULL DEFAULT true,
  "electionsPush" BOOLEAN NOT NULL DEFAULT true,
  "systemPush" BOOLEAN NOT NULL DEFAULT true,
  "quietHoursEnabled" BOOLEAN NOT NULL DEFAULT false,
  "quietHoursStart" TEXT,
  "quietHoursEnd" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NotificationPreference_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Notification_memberId_idx" ON "Notification"("memberId");
CREATE INDEX "Notification_type_idx" ON "Notification"("type");
CREATE INDEX "Notification_status_idx" ON "Notification"("status");
CREATE INDEX "Notification_priority_idx" ON "Notification"("priority");
CREATE INDEX "Notification_entityType_entityId_idx" ON "Notification"("entityType", "entityId");
CREATE INDEX "Notification_createdAt_idx" ON "Notification"("createdAt");
CREATE UNIQUE INDEX "DevicePushToken_token_key" ON "DevicePushToken"("token");
CREATE INDEX "DevicePushToken_memberId_idx" ON "DevicePushToken"("memberId");
CREATE INDEX "DevicePushToken_provider_idx" ON "DevicePushToken"("provider");
CREATE INDEX "DevicePushToken_platform_idx" ON "DevicePushToken"("platform");
CREATE INDEX "DevicePushToken_isActive_idx" ON "DevicePushToken"("isActive");
CREATE INDEX "DevicePushToken_lastSeenAt_idx" ON "DevicePushToken"("lastSeenAt");
CREATE INDEX "PushDelivery_notificationId_idx" ON "PushDelivery"("notificationId");
CREATE INDEX "PushDelivery_memberId_idx" ON "PushDelivery"("memberId");
CREATE INDEX "PushDelivery_pushTokenId_idx" ON "PushDelivery"("pushTokenId");
CREATE INDEX "PushDelivery_status_idx" ON "PushDelivery"("status");
CREATE INDEX "PushDelivery_provider_idx" ON "PushDelivery"("provider");
CREATE INDEX "PushDelivery_createdAt_idx" ON "PushDelivery"("createdAt");
CREATE UNIQUE INDEX "NotificationPreference_memberId_key" ON "NotificationPreference"("memberId");

ALTER TABLE "Notification" ADD CONSTRAINT "Notification_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DevicePushToken" ADD CONSTRAINT "DevicePushToken_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "Notification"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PushDelivery" ADD CONSTRAINT "PushDelivery_pushTokenId_fkey" FOREIGN KEY ("pushTokenId") REFERENCES "DevicePushToken"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "NotificationPreference" ADD CONSTRAINT "NotificationPreference_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
