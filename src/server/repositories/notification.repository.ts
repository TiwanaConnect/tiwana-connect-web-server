import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export function findNotifications(args: Prisma.NotificationFindManyArgs) {
  return prisma.notification.findMany({ ...args, include: { member: true, pushDeliveries: true } });
}
