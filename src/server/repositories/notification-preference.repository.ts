import { prisma } from "@/lib/db/prisma";

export function findNotificationPreference(memberId: string) {
  return prisma.notificationPreference.findUnique({ where: { memberId } });
}
