import type { NotificationPriority, NotificationType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

import { sendPushToMembers } from "./push.service";

export async function notifyMembers(input: {
  memberIds: string[];
  type: NotificationType;
  title: string;
  body?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  actionLabel?: string | null;
  actionUrl?: string | null;
  priority?: NotificationPriority;
  metadata?: Record<string, unknown>;
  push?: boolean;
}) {
  const memberIds = [...new Set(input.memberIds)];
  if (memberIds.length === 0) return { notificationsCreated: 0, push: null };
  const activeMembers = await prisma.member.findMany({
    where: { id: { in: memberIds }, deletedAt: null, status: "ACTIVE" },
    select: { id: true }
  });
  const targetIds = activeMembers.map((member) => member.id);
  const notifications = await prisma.$transaction(
    targetIds.map((memberId) =>
      prisma.notification.create({
        data: {
          memberId,
          type: input.type,
          priority: input.priority ?? "NORMAL",
          title: input.title,
          body: input.body,
          entityType: input.entityType,
          entityId: input.entityId,
          actionLabel: input.actionLabel,
          actionUrl: input.actionUrl,
          metadata: input.metadata as Prisma.InputJsonValue
        }
      })
    )
  );
  const notificationByMemberId = new Map(notifications.map((notification) => [notification.memberId, notification.id]));
  const push = input.push
    ? await sendPushToMembers({
        memberIds: targetIds,
        notificationByMemberId,
        title: input.title,
        body: input.body,
        type: input.type,
        priority: input.priority,
        data: {
          type: input.type,
          entityType: input.entityType,
          entityId: input.entityId,
          actionUrl: input.actionUrl
        }
      })
    : null;
  return { notificationsCreated: notifications.length, push };
}

export async function listMyNotifications(input: { memberId: string; status?: "UNREAD" | "READ" | "ARCHIVED"; limit: number; cursor?: string }) {
  const notifications = await prisma.notification.findMany({
    where: { memberId: input.memberId, deletedAt: null, ...(input.status ? { status: input.status } : {}) },
    orderBy: { createdAt: "desc" },
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: input.limit + 1
  });
  return {
    notifications: notifications.slice(0, input.limit),
    nextCursor: notifications.length > input.limit ? notifications[input.limit]?.id ?? null : null
  };
}

export async function markNotificationRead(input: { memberId: string; notificationId: string }) {
  const notification = await prisma.notification.update({
    where: { id: input.notificationId, memberId: input.memberId },
    data: { status: "READ", readAt: new Date() }
  });
  return { notification };
}

export async function markAllNotificationsRead(memberId: string) {
  await prisma.notification.updateMany({ where: { memberId, status: "UNREAD" }, data: { status: "READ", readAt: new Date() } });
  return { ok: true };
}

export async function archiveNotification(input: { memberId: string; notificationId: string }) {
  const notification = await prisma.notification.update({
    where: { id: input.notificationId, memberId: input.memberId },
    data: { status: "ARCHIVED", archivedAt: new Date() }
  });
  return { notification };
}

export async function notificationStats() {
  const [totalNotifications, unreadCount, pushSentCount, failedCount, inactiveTokenCount] = await Promise.all([
    prisma.notification.count({ where: { deletedAt: null } }),
    prisma.notification.count({ where: { status: "UNREAD", deletedAt: null } }),
    prisma.pushDelivery.count({ where: { status: "SENT" } }),
    prisma.pushDelivery.count({ where: { status: { in: ["FAILED", "DEVICE_NOT_REGISTERED"] } } }),
    prisma.devicePushToken.count({ where: { isActive: false } })
  ]);
  return { totalNotifications, unreadCount, pushSentCount, failedCount, inactiveTokenCount };
}
