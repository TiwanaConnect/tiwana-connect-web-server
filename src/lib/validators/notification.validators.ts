import { NotificationPriority, NotificationType, PushPlatform, PushProvider } from "@prisma/client";
import { z } from "zod";

const emptyToUndefined = (value: unknown) => (value === "" ? undefined : value);
const nullableString = z.preprocess(emptyToUndefined, z.string().trim().min(1).nullable().optional());

export const registerPushTokenSchema = z.object({
  token: z.string().trim().min(1),
  provider: z.nativeEnum(PushProvider).default(PushProvider.EXPO),
  platform: z.nativeEnum(PushPlatform).default(PushPlatform.UNKNOWN),
  deviceId: nullableString,
  deviceName: nullableString
});

export const unregisterPushTokenSchema = z.object({ token: z.string().trim().min(1) });

export const notificationListQuerySchema = z.object({
  status: z.enum(["UNREAD", "READ", "ARCHIVED"]).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.preprocess(emptyToUndefined, z.string().optional())
});

export const notificationPreferenceSchema = z.object({
  pushEnabled: z.boolean().optional(),
  announcementsPush: z.boolean().optional(),
  eventInvitesPush: z.boolean().optional(),
  fundsPush: z.boolean().optional(),
  helpRequestsPush: z.boolean().optional(),
  electionsPush: z.boolean().optional(),
  systemPush: z.boolean().optional(),
  quietHoursEnabled: z.boolean().optional(),
  quietHoursStart: nullableString,
  quietHoursEnd: nullableString
});

export const sendTestPushSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1),
  title: z.string().trim().min(1),
  body: nullableString
});

export const pushDeliveryQuerySchema = z.object({
  memberId: z.string().optional(),
  status: z.string().optional(),
  provider: z.string().optional(),
  fromDate: z.string().optional(),
  toDate: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  cursor: z.preprocess(emptyToUndefined, z.string().optional())
});

export const notifyMembersSchema = z.object({
  memberIds: z.array(z.string().min(1)).min(1),
  type: z.nativeEnum(NotificationType),
  title: z.string().trim().min(1),
  body: nullableString,
  priority: z.nativeEnum(NotificationPriority).default(NotificationPriority.NORMAL)
});
