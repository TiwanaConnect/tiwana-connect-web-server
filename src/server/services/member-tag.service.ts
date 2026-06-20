import type { MemberTagType } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { findTagById, findTags } from "@/server/repositories/member-tag.repository";

import { recordAuditLog } from "./audit.service";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export async function listTags(filters: { q?: string; type?: MemberTagType; isActive?: "true" | "false" }) {
  const tags = await findTags({
    where: {
      ...(filters.q ? { OR: [{ name: { contains: filters.q, mode: "insensitive" } }, { slug: { contains: filters.q, mode: "insensitive" } }] } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.isActive ? { isActive: filters.isActive === "true" } : {})
    },
    orderBy: [{ isActive: "desc" }, { name: "asc" }]
  });

  return {
    tags: tags.map((tag) => ({
      id: tag.id,
      name: tag.name,
      slug: tag.slug,
      type: tag.type,
      description: tag.description,
      color: tag.color,
      isActive: tag.isActive,
      usageCount: tag.members.length
    }))
  };
}

export async function createTag(input: {
  name: string;
  slug?: string;
  type: MemberTagType;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
  actorMemberId: string;
}) {
  const tag = await prisma.memberTag.create({
    data: {
      name: input.name,
      slug: input.slug ?? slugify(input.name),
      type: input.type,
      description: input.description,
      color: input.color,
      isActive: input.isActive ?? true
    }
  });
  await recordAuditLog({ actorMemberId: input.actorMemberId, action: "tag_created", entityType: "MEMBER_TAG", entityId: tag.id });
  return { tag };
}

export async function updateTag(id: string, input: {
  name?: string;
  slug?: string;
  type?: MemberTagType;
  description?: string | null;
  color?: string | null;
  isActive?: boolean;
  actorMemberId: string;
}) {
  const tag = await prisma.memberTag.update({
    where: { id },
    data: {
      name: input.name,
      slug: input.slug,
      type: input.type,
      description: input.description,
      color: input.color,
      isActive: input.isActive
    }
  });
  await recordAuditLog({ actorMemberId: input.actorMemberId, action: "tag_updated", entityType: "MEMBER_TAG", entityId: tag.id });
  return { tag };
}

export async function disableTag(id: string, actorMemberId: string) {
  const existing = await findTagById(id);
  if (!existing) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Tag not found.", 404);
  const tag = await prisma.memberTag.update({ where: { id }, data: { isActive: false } });
  await recordAuditLog({ actorMemberId, action: "tag_disabled", entityType: "MEMBER_TAG", entityId: id });
  return { tag };
}

export async function getMemberTags(memberId: string) {
  const assignments = await prisma.memberTagAssignment.findMany({
    where: { memberId },
    include: { tag: true },
    orderBy: { createdAt: "desc" }
  });
  return { tags: assignments.map((assignment) => assignment.tag) };
}

export async function assignMemberTags(input: { memberId: string; tagIds: string[]; actorMemberId: string }) {
  const tagIds = [...new Set(input.tagIds)];
  await prisma.$transaction(
    tagIds.map((tagId) =>
      prisma.memberTagAssignment.upsert({
        where: { memberId_tagId: { memberId: input.memberId, tagId } },
        update: { assignedById: input.actorMemberId },
        create: { memberId: input.memberId, tagId, assignedById: input.actorMemberId }
      })
    )
  );
  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "member_tags_assigned",
    entityType: "MEMBER_TAG",
    entityId: input.memberId,
    metadata: { tagIds }
  });
  return getMemberTags(input.memberId);
}

export async function removeMemberTag(input: { memberId: string; tagId: string; actorMemberId: string }) {
  await prisma.memberTagAssignment.deleteMany({ where: { memberId: input.memberId, tagId: input.tagId } });
  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "member_tag_removed",
    entityType: "MEMBER_TAG",
    entityId: input.memberId,
    metadata: { tagId: input.tagId }
  });
  return getMemberTags(input.memberId);
}
