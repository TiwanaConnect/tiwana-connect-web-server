import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const directoryMemberInclude = {
  userAccount: true,
  directorySetting: true,
  tagAssignments: { include: { tag: true } }
} satisfies Prisma.MemberInclude;

export function findDirectoryMembers(args: Prisma.MemberFindManyArgs) {
  return prisma.member.findMany({ ...args, include: directoryMemberInclude });
}

export function findDirectoryMemberById(id: string) {
  return prisma.member.findUnique({ where: { id }, include: directoryMemberInclude });
}
