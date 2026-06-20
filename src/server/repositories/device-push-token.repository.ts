import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export function findDevicePushTokens(args: Prisma.DevicePushTokenFindManyArgs) {
  return prisma.devicePushToken.findMany(args);
}
