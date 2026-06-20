import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export function findTags(args: Prisma.MemberTagFindManyArgs = {}) {
  return prisma.memberTag.findMany({
    ...args,
    include: { members: true }
  });
}

export function findTagById(id: string) {
  return prisma.memberTag.findUnique({
    where: { id },
    include: { members: true }
  });
}
