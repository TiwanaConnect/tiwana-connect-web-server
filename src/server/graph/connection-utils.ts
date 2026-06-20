import type { FamilyRelationship, FamilyRelationshipType } from "@prisma/client";
import type { MobileRelationshipType, TreeConnection } from "@/types/family-tree";

export function toMobileRelationshipType(
  type: FamilyRelationshipType
): MobileRelationshipType {
  return type.toLowerCase() as MobileRelationshipType;
}

export function visualConnectionKey(input: {
  fromMemberId: string;
  toMemberId: string;
  type: FamilyRelationshipType;
}) {
  if (input.type === "SPOUSE") {
    return `${[input.fromMemberId, input.toMemberId].sort().join(":")}:SPOUSE`;
  }

  return `${input.fromMemberId}:${input.toMemberId}:${input.type}`;
}

export function buildTreeConnections(
  memberIds: Set<string>,
  relationships: FamilyRelationship[]
): TreeConnection[] {
  const seen = new Set<string>();
  const connections: TreeConnection[] = [];

  for (const relationship of relationships) {
    if (
      !memberIds.has(relationship.fromMemberId) ||
      !memberIds.has(relationship.toMemberId)
    ) {
      continue;
    }

    const key = visualConnectionKey(relationship);

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    connections.push({
      id:
        relationship.type === "SPOUSE"
          ? key.toLowerCase()
          : `${relationship.fromMemberId}-${relationship.toMemberId}-${relationship.type.toLowerCase()}`,
      fromMemberId: relationship.fromMemberId,
      toMemberId: relationship.toMemberId,
      type: toMobileRelationshipType(relationship.type),
      isBidirectional: relationship.type === "SPOUSE"
    });
  }

  return connections;
}
