import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const eventInclude = {
  createdBy: { include: { userAccount: true } },
  invites: { include: { member: { include: { userAccount: true } } } }
} satisfies Prisma.FamilyEventInclude;

export function findEventById(id: string) {
  return prisma.familyEvent.findUnique({
    where: { id },
    include: eventInclude
  });
}

export function findEvents(args: Prisma.FamilyEventFindManyArgs) {
  return prisma.familyEvent.findMany({
    ...args,
    include: eventInclude
  });
}
