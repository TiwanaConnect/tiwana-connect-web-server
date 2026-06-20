import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export const electionInclude = {
  createdBy: true,
  phases: true,
  nominations: { include: { member: true } },
  candidates: { include: { member: true, nomination: true } },
  voters: { include: { member: true } },
  result: true,
  audits: true
} satisfies Prisma.ElectionInclude;

export function findElectionById(id: string) {
  return prisma.election.findUnique({ where: { id }, include: electionInclude });
}

export function findElections(args: Prisma.ElectionFindManyArgs) {
  return prisma.election.findMany({ ...args, include: electionInclude });
}
