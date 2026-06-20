import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const fundTransactionInclude = {
  fund: true,
  contributor: true,
  recipientMember: true,
  recordedBy: true,
  confirmedBy: true,
  request: { include: { member: true } }
} satisfies Prisma.FundTransactionInclude;

export function findFundTransactionById(id: string) {
  return prisma.fundTransaction.findUnique({
    where: { id },
    include: fundTransactionInclude
  });
}

export function findFundTransactions(args: Prisma.FundTransactionFindManyArgs) {
  return prisma.fundTransaction.findMany({
    ...args,
    include: fundTransactionInclude
  });
}
