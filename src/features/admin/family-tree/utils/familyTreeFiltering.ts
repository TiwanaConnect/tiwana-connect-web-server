import type {
  AdminFamilyTreeMember,
  AdminFamilyTreeRelationship,
  FamilyChartPerson
} from "../types";

export function searchFamilyMembers(members: AdminFamilyTreeMember[], search: string) {
  const query = search.trim().toLowerCase();
  if (!query) return [];

  return members
    .filter((member) =>
      [
        member.id,
        member.fullName,
        member.alias,
        member.initials,
        member.city,
        member.profession,
        member.branchLabel,
        member.phone
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    )
    .slice(0, 8);
}

export function filterFamilyGraphByLevels(input: {
  members: AdminFamilyTreeMember[];
  relationships: AdminFamilyTreeRelationship[];
  focusMemberId: string | null;
  maxLevels: number | "all";
}) {
  if (!input.focusMemberId || input.maxLevels === "all") {
    return { members: input.members, relationships: input.relationships };
  }

  const maxDepth = Math.max(1, input.maxLevels);
  const neighbors = new Map<string, Set<string>>();

  for (const relationship of input.relationships) {
    if (!neighbors.has(relationship.fromMemberId)) neighbors.set(relationship.fromMemberId, new Set());
    if (!neighbors.has(relationship.toMemberId)) neighbors.set(relationship.toMemberId, new Set());
    neighbors.get(relationship.fromMemberId)?.add(relationship.toMemberId);
    neighbors.get(relationship.toMemberId)?.add(relationship.fromMemberId);
  }

  const kept = new Set<string>([input.focusMemberId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: input.focusMemberId, depth: 0 }];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= maxDepth) continue;

    for (const nextId of neighbors.get(current.id) ?? []) {
      if (kept.has(nextId)) continue;
      kept.add(nextId);
      queue.push({ id: nextId, depth: current.depth + 1 });
    }
  }

  return {
    members: input.members.filter((member) => kept.has(member.id)),
    relationships: input.relationships.filter(
      (relationship) => kept.has(relationship.fromMemberId) && kept.has(relationship.toMemberId)
    )
  };
}

export function applyCollapsedBranches(input: {
  persons: FamilyChartPerson[];
  focusMemberId: string | null;
  collapsedMemberIds: Set<string>;
}) {
  if (input.collapsedMemberIds.size === 0) return input.persons;

  const childIdsByParentId = new Map<string, string[]>();
  for (const person of input.persons) {
    childIdsByParentId.set(person.id, person.rels.children);
  }

  const hidden = new Set<string>();
  for (const collapsedId of input.collapsedMemberIds) {
    const stack = [...(childIdsByParentId.get(collapsedId) ?? [])];
    while (stack.length > 0) {
      const childId = stack.pop();
      if (!childId || childId === input.focusMemberId || hidden.has(childId)) continue;
      hidden.add(childId);
      stack.push(...(childIdsByParentId.get(childId) ?? []));
    }
  }

  const visibleIds = new Set(input.persons.filter((person) => !hidden.has(person.id)).map((person) => person.id));

  return input.persons
    .filter((person) => visibleIds.has(person.id))
    .map((person) => ({
      ...person,
      rels: {
        parents: person.rels.parents.filter((id) => visibleIds.has(id)),
        spouses: person.rels.spouses.filter((id) => visibleIds.has(id)),
        children: person.rels.children.filter((id) => visibleIds.has(id))
      }
    }));
}
