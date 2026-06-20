import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export function findPushDeliveries(args: Prisma.PushDeliveryFindManyArgs) {
  return prisma.pushDelivery.findMany({ ...args, include: { member: true, pushToken: true, notification: true } });
}
