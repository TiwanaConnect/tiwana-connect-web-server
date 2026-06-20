import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export function findMembers(args: Prisma.MemberFindManyArgs) {
  return prisma.member.findMany(args);
}

export function countMembers(where: Prisma.MemberWhereInput) {
  return prisma.member.count({ where });
}

export function findMemberById(id: string) {
  return prisma.member.findUnique({
    where: { id },
    include: { userAccount: true }
  });
}

export function createMember(data: Prisma.MemberCreateInput) {
  return prisma.member.create({
    data,
    include: { userAccount: true }
  });
}

export function updateMember(id: string, data: Prisma.MemberUpdateInput) {
  return prisma.member.update({
    where: { id },
    data,
    include: { userAccount: true }
  });
}
