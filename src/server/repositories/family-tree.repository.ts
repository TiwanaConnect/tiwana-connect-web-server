import { prisma } from "@/lib/db/prisma";

export async function loadFamilyGraphData(options?: {
  includeDeleted?: boolean;
  includeBlocked?: boolean;
}) {
  const members = await prisma.member.findMany({
    where: {
      ...(options?.includeDeleted ? {} : { deletedAt: null }),
      ...(options?.includeBlocked ? {} : { status: { not: "BLOCKED" } })
    },
    include: { userAccount: true }
  });
  const memberIds = members.map((member) => member.id);
  const relationships = await prisma.familyRelationship.findMany({
    where: {
      fromMemberId: { in: memberIds },
      toMemberId: { in: memberIds }
    },
    orderBy: { createdAt: "asc" }
  });

  return { members, relationships };
}

export async function listStandaloneMembers() {
  return prisma.member.findMany({
    where: {
      deletedAt: null,
      relationshipsFrom: { none: {} },
      relationshipsTo: { none: {} }
    },
    include: { userAccount: true },
    orderBy: [{ fullName: "asc" }, { alias: "asc" }]
  });
}

export async function listFamilyHeads() {
  return prisma.member.findMany({
    where: {
      deletedAt: null,
      isFamilyHead: true
    },
    include: { userAccount: true },
    orderBy: [{ fullName: "asc" }, { alias: "asc" }]
  });
}
