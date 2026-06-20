import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const helpRequestInclude = {
  fromMember: true,
  toMember: true
} satisfies Prisma.MemberHelpRequestInclude;

export function findHelpRequestById(id: string) {
  return prisma.memberHelpRequest.findUnique({
    where: { id },
    include: helpRequestInclude
  });
}

export function findHelpRequests(args: Prisma.MemberHelpRequestFindManyArgs) {
  return prisma.memberHelpRequest.findMany({
    ...args,
    include: helpRequestInclude
  });
}
