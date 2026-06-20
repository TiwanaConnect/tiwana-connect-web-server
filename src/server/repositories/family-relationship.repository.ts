import type { FamilyRelationshipType } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export function listRelationshipsForMember(memberId: string) {
  return prisma.familyRelationship.findMany({
    where: {
      OR: [{ fromMemberId: memberId }, { toMemberId: memberId }]
    },
    include: {
      fromMember: true,
      toMember: true
    },
    orderBy: { createdAt: "desc" }
  });
}

export function findRelationshipDuplicate(input: {
  fromMemberId: string;
  toMemberId: string;
  type: FamilyRelationshipType;
}) {
  return prisma.familyRelationship.findFirst({ where: input });
}
