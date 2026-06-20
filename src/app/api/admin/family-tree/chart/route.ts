import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { validateFamilyTreeRelationships } from "@/features/admin/family-tree/utils/familyTreeValidation";
import type { AdminFamilyTreeChartResponse } from "@/features/admin/family-tree/types";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  await requireSuperAdminSession(request);

  const includeDeactivated = request.nextUrl.searchParams.get("includeDeactivated") === "true";

  const members = await prisma.member.findMany({
    where: includeDeactivated ? {} : { deletedAt: null },
    orderBy: [{ isFamilyHead: "desc" }, { fullName: "asc" }, { alias: "asc" }, { id: "asc" }],
    select: {
      id: true,
      fullName: true,
      alias: true,
      initials: true,
      gender: true,
      visibility: true,
      status: true,
      isFamilyHead: true,
      city: true,
      profession: true,
      phone: true,
      branchLabel: true,
      dateOfBirth: true,
      notes: true,
      deletedAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const memberIds = members.map((member) => member.id);
  const relationships = await prisma.familyRelationship.findMany({
    where: {
      fromMemberId: { in: memberIds },
      toMemberId: { in: memberIds }
    },
    orderBy: [{ type: "asc" }, { createdAt: "asc" }],
    select: {
      id: true,
      fromMemberId: true,
      toMemberId: true,
      type: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const normalizedMembers = members.map((member) => ({
    ...member,
    dateOfBirth: member.dateOfBirth?.toISOString() ?? null,
    deletedAt: member.deletedAt?.toISOString() ?? null,
    createdAt: member.createdAt.toISOString(),
    updatedAt: member.updatedAt.toISOString()
  }));
  const normalizedRelationships = relationships.map((relationship) => ({
    ...relationship,
    createdAt: relationship.createdAt.toISOString(),
    updatedAt: relationship.updatedAt.toISOString()
  }));
  const validRelationshipIds = new Set(
    validateFamilyTreeRelationships({
      members: normalizedMembers,
      relationships: normalizedRelationships
    }).validRelationships.map((relationship) => relationship.id)
  );
  const connectedMemberIds = new Set<string>();

  for (const relationship of normalizedRelationships) {
    if (!validRelationshipIds.has(relationship.id)) continue;
    connectedMemberIds.add(relationship.fromMemberId);
    connectedMemberIds.add(relationship.toMemberId);
  }

  const response: AdminFamilyTreeChartResponse = {
    members: normalizedMembers,
    relationships: normalizedRelationships,
    stats: {
      totalMembers: normalizedMembers.length,
      activeMembers: normalizedMembers.filter((member) => member.status === "ACTIVE" && !member.deletedAt).length,
      relationshipCount: normalizedRelationships.length,
      familyHeads: normalizedMembers.filter((member) => member.isFamilyHead).length,
      standaloneMembers: normalizedMembers.filter((member) => !connectedMemberIds.has(member.id)).length
    },
    warnings: validateFamilyTreeRelationships({
      members: normalizedMembers,
      relationships: normalizedRelationships
    }).warnings
  };

  return apiSuccess(response);
});
