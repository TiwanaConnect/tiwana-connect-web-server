import { Expo } from "expo-server-sdk";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";

export async function registerPushToken(input: {
  memberId: string;
  token: string;
  provider: "EXPO" | "FCM" | "APNS";
  platform: "IOS" | "ANDROID" | "WEB" | "UNKNOWN";
  deviceId?: string | null;
  deviceName?: string | null;
}) {
  if (input.provider === "EXPO" && !Expo.isExpoPushToken(input.token)) {
    throw new AppError(API_ERROR_CODES.PUSH_TOKEN_INVALID, "Invalid Expo push token.", 400);
  }
  const token = await prisma.devicePushToken.upsert({
    where: { token: input.token },
    update: {
      memberId: input.memberId,
      provider: input.provider,
      platform: input.platform,
      deviceId: input.deviceId,
      deviceName: input.deviceName,
      isActive: true,
      lastSeenAt: new Date()
    },
    create: {
      memberId: input.memberId,
      token: input.token,
      provider: input.provider,
      platform: input.platform,
      deviceId: input.deviceId,
      deviceName: input.deviceName
    }
  });
  return { token };
}

export async function unregisterPushToken(input: { memberId: string; token: string }) {
  await prisma.devicePushToken.updateMany({
    where: { memberId: input.memberId, token: input.token },
    data: { isActive: false, lastSeenAt: new Date() }
  });
  return { ok: true };
}

export async function listMyPushTokens(memberId: string) {
  return {
    tokens: await prisma.devicePushToken.findMany({
      where: { memberId, isActive: true },
      orderBy: { lastSeenAt: "desc" }
    })
  };
}
