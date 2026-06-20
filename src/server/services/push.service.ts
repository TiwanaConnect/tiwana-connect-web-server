import type { NotificationPriority, NotificationType, Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { ExpoPushProvider } from "@/server/push/expo-push.provider";

function pushAllowed(type: NotificationType, pref?: {
  pushEnabled: boolean;
  announcementsPush: boolean;
  eventInvitesPush: boolean;
  fundsPush: boolean;
  helpRequestsPush: boolean;
  electionsPush: boolean;
  systemPush: boolean;
} | null) {
  if (!pref) return true;
  if (!pref.pushEnabled) return false;
  if (type === "ANNOUNCEMENT") return pref.announcementsPush;
  if (type.startsWith("EVENT_")) return pref.eventInvitesPush;
  if (type.startsWith("FUND_")) return pref.fundsPush;
  if (type.startsWith("HELP_")) return pref.helpRequestsPush;
  if (type.startsWith("ELECTION_") || type === "PRESIDENT_CEREMONY") return pref.electionsPush;
  return pref.systemPush;
}

function priorityToExpo(priority?: NotificationPriority) {
  return priority === "HIGH" || priority === "URGENT" ? "high" : "default";
}

export async function sendPushToMembers(input: {
  memberIds: string[];
  notificationByMemberId?: Map<string, string>;
  title: string;
  body?: string | null;
  data?: Record<string, unknown>;
  type: NotificationType;
  priority?: NotificationPriority;
}) {
  const memberIds = [...new Set(input.memberIds)];
  if (process.env.PUSH_ENABLED === "false") {
    return { requestedMembers: memberIds.length, tokensFound: 0, sent: 0, failed: 0, skipped: memberIds.length };
  }
  const tokens = await prisma.devicePushToken.findMany({
    where: { memberId: { in: memberIds }, isActive: true, provider: "EXPO" },
    include: { member: { include: { notificationPreference: true } } }
  });
  const allowed = tokens.filter((token) => pushAllowed(input.type, token.member.notificationPreference));
  const skipped = tokens.length - allowed.length;
  const deliveries = await prisma.$transaction(
    allowed.map((token) =>
      prisma.pushDelivery.create({
        data: {
          memberId: token.memberId,
          pushTokenId: token.id,
          notificationId: input.notificationByMemberId?.get(token.memberId),
          provider: token.provider,
          title: input.title,
          body: input.body,
          data: input.data as Prisma.InputJsonValue
        }
      })
    )
  );
  const deliveryByToken = new Map(allowed.map((token, index) => [token.token, { token, delivery: deliveries[index] }]));
  const provider = new ExpoPushProvider();
  const results = await provider.send(allowed.map((token) => token.token), {
    title: input.title,
    body: input.body,
    data: input.data,
    sound: "default",
    priority: priorityToExpo(input.priority)
  });
  let sent = 0;
  let failed = 0;
  for (const result of results) {
    const item = deliveryByToken.get(result.token);
    if (!item?.delivery) continue;
    if (result.success) {
      sent += 1;
      await prisma.pushDelivery.update({
        where: { id: item.delivery.id },
        data: { status: "SENT", providerTicketId: result.ticketId, sentAt: new Date() }
      });
    } else {
      failed += 1;
      await prisma.pushDelivery.update({
        where: { id: item.delivery.id },
        data: {
          status: result.deviceNotRegistered ? "DEVICE_NOT_REGISTERED" : "FAILED",
          providerError: result.error,
          failedAt: new Date()
        }
      });
      if (result.deviceNotRegistered) {
        await prisma.devicePushToken.update({ where: { id: item.token.id }, data: { isActive: false } });
      }
    }
  }
  return { requestedMembers: memberIds.length, tokensFound: tokens.length, sent, failed, skipped };
}
