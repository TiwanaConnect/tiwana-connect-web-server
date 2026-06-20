import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export function findUserByUsername(username: string) {
  return prisma.userAccount.findUnique({
    where: { username },
    include: { member: true }
  });
}

export function findUserByMemberId(memberId: string) {
  return prisma.userAccount.findUnique({
    where: { memberId },
    include: { member: true }
  });
}

export function createUserAccount(data: Prisma.UserAccountCreateInput) {
  return prisma.userAccount.create({
    data,
    include: { member: true }
  });
}
