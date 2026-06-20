import type {
  AdminFamilyTreeMember,
  AdminFamilyTreeRelationship,
  AdminFamilyTreeWarning
} from "../types";

export function validateFamilyTreeRelationships(input: {
  members: AdminFamilyTreeMember[];
  relationships: AdminFamilyTreeRelationship[];
}) {
  const memberIds = new Set(input.members.map((member) => member.id));
  const warnings: AdminFamilyTreeWarning[] = [];
  const validRelationships: AdminFamilyTreeRelationship[] = [];
  const seen = new Set<string>();

  for (const relationship of input.relationships) {
    if (relationship.fromMemberId === relationship.toMemberId) {
      warnings.push({
        code: "SELF_RELATIONSHIP",
        message: "A relationship points to the same member on both sides.",
        relationshipId: relationship.id,
        memberId: relationship.fromMemberId
      });
      continue;
    }

    if (!memberIds.has(relationship.fromMemberId) || !memberIds.has(relationship.toMemberId)) {
      warnings.push({
        code: "MISSING_MEMBER",
        message: "A relationship references a member that is not included in this chart.",
        relationshipId: relationship.id
      });
      continue;
    }

    const key = `${relationship.fromMemberId}:${relationship.toMemberId}:${relationship.type}`;
    if (seen.has(key)) {
      warnings.push({
        code: "DUPLICATE_RELATIONSHIP",
        message: "A duplicate relationship was skipped.",
        relationshipId: relationship.id
      });
      continue;
    }

    seen.add(key);
    validRelationships.push(relationship);
  }

  return { validRelationships, warnings };
}

export function findParentChildCycleWarnings(relationships: AdminFamilyTreeRelationship[]) {
  const parentChildPairs = new Set<string>();
  const warnings: AdminFamilyTreeWarning[] = [];

  for (const relationship of relationships) {
    if (relationship.type !== "FATHER" && relationship.type !== "MOTHER" && relationship.type !== "CHILD") {
      continue;
    }

    const parentId = relationship.type === "CHILD" ? relationship.toMemberId : relationship.fromMemberId;
    const childId = relationship.type === "CHILD" ? relationship.fromMemberId : relationship.toMemberId;
    const reverseKey = `${childId}:${parentId}`;

    if (parentChildPairs.has(reverseKey)) {
      warnings.push({
        code: "CIRCULAR_PARENT_CHILD",
        message: "A circular parent-child relationship was detected and skipped.",
        relationshipId: relationship.id
      });
      continue;
    }

    parentChildPairs.add(`${parentId}:${childId}`);
  }

  return warnings;
}
