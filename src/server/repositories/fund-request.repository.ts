import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export const fundRequestInclude = {
  fund: true,
  member: true,
  transactions: { where: { deletedAt: null } }
} satisfies Prisma.FundContributionRequestInclude;

export function findFundRequestById(id: string) {
  return prisma.fundContributionRequest.findUnique({
    where: { id },
    include: fundRequestInclude
  });
}

export function findFundRequests(args: Prisma.FundContributionRequestFindManyArgs) {
  return prisma.fundContributionRequest.findMany({
    ...args,
    include: fundRequestInclude
  });
}
