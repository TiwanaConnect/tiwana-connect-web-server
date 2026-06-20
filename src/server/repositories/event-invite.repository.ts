import { prisma } from "@/lib/db/prisma";

export function findInvite(eventId: string, memberId: string) {
  return prisma.eventInvite.findUnique({
    where: { eventId_memberId: { eventId, memberId } },
    include: { member: { include: { userAccount: true } } }
  });
}
