import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const fundInclude = {
  createdBy: { include: { userAccount: true } },
  transactions: {
    where: { deletedAt: null },
    include: {
      contributor: true,
      recipientMember: true,
      recordedBy: true,
      confirmedBy: true
    }
  },
  requests: { include: { member: true } }
} satisfies Prisma.FamilyFundInclude;

export function findFundById(id: string) {
  return prisma.familyFund.findUnique({
    where: { id },
    include: fundInclude
  });
}

export function findFunds(args: Prisma.FamilyFundFindManyArgs) {
  return prisma.familyFund.findMany({
    ...args,
    include: fundInclude
  });
}
