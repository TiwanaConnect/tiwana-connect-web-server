import { prisma } from "@/lib/db/prisma";

type NotificationPreferencePatch = {
  pushEnabled?: boolean;
  announcementsPush?: boolean;
  eventInvitesPush?: boolean;
  fundsPush?: boolean;
  helpRequestsPush?: boolean;
  electionsPush?: boolean;
  systemPush?: boolean;
  quietHoursEnabled?: boolean;
  quietHoursStart?: string | null;
  quietHoursEnd?: string | null;
};

export async function getNotificationPreference(memberId: string) {
  const preference = await prisma.notificationPreference.upsert({
    where: { memberId },
    update: {},
    create: { memberId }
  });
  return { preference };
}

export async function updateNotificationPreference(memberId: string, data: NotificationPreferencePatch) {
  const preference = await prisma.notificationPreference.upsert({
    where: { memberId },
    update: data,
    create: { memberId, ...data }
  });
  return { preference };
}
