import { FamilyRelationshipType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toAdminMemberDto } from "@/server/dto/member.dto";

import { recordAuditLog } from "./audit.service";

type RelationshipWithMembers = Prisma.FamilyRelationshipGetPayload<{
  include: { fromMember: true; toMember: true };
}>;

export function toRelationshipDto(relationship: RelationshipWithMembers) {
  return {
    id: relationship.id,
    fromMemberId: relationship.fromMemberId,
    toMemberId: relationship.toMemberId,
    type: relationship.type,
    metadata: relationship.metadata,
    createdAt: relationship.createdAt,
    fromMember: toAdminMemberDto({ ...relationship.fromMember, userAccount: null }),
    toMember: toAdminMemberDto({ ...relationship.toMember, userAccount: null })
  };
}

async function listRelationshipsForMemberRaw(memberId: string) {
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

export async function listRelationshipsForMember(memberId: string) {
  const relationships = await listRelationshipsForMemberRaw(memberId);
  return relationships.map(toRelationshipDto);
}

export async function createRelationship(input: {
  fromMemberId: string;
  toMemberId: string;
  type: FamilyRelationshipType;
  metadata?: Record<string, unknown>;
  actorMemberId?: string;
}) {
  if (input.fromMemberId === input.toMemberId) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "A member cannot relate to themselves.", 400);
  }

  const duplicate = await prisma.familyRelationship.findUnique({
    where: {
      fromMemberId_toMemberId_type: {
        fromMemberId: input.fromMemberId,
        toMemberId: input.toMemberId,
        type: input.type
      }
    }
  });

  if (duplicate) {
    throw new AppError(API_ERROR_CODES.CONFLICT, "Relationship already exists.", 409);
  }

  const relationship = await prisma.familyRelationship.create({
    data: {
      fromMemberId: input.fromMemberId,
      toMemberId: input.toMemberId,
      type: input.type,
      metadata: input.metadata as Prisma.InputJsonValue
    },
    include: {
      fromMember: true,
      toMember: true
    }
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "RELATIONSHIP_CREATED",
    entityType: "FAMILY_RELATIONSHIP",
    entityId: relationship.id
  });

  return toRelationshipDto(relationship);
}

export async function deleteRelationship(input: {
  memberId: string;
  relationshipId: string;
  actorMemberId?: string;
}) {
  const relationship = await prisma.familyRelationship.findUnique({
    where: { id: input.relationshipId }
  });

  if (!relationship) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Relationship not found.", 404);
  }

  if (
    relationship.fromMemberId !== input.memberId &&
    relationship.toMemberId !== input.memberId
  ) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Relationship does not belong to this member.", 403);
  }

  await prisma.familyRelationship.delete({ where: { id: input.relationshipId } });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "RELATIONSHIP_DELETED",
    entityType: "FAMILY_RELATIONSHIP",
    entityId: input.relationshipId
  });

  return { ok: true };
}
