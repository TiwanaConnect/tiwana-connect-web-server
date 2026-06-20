import type {
  AdminFamilyTreeMember,
  AdminFamilyTreeRelationship,
  AdminFamilyTreeWarning,
  FamilyChartGraph,
  FamilyChartPerson
} from "../types";
import { findParentChildCycleWarnings, validateFamilyTreeRelationships } from "./familyTreeValidation";

type MutablePerson = FamilyChartPerson & {
  rels: {
    parents: string[];
    spouses: string[];
    children: string[];
  };
};

export function toFamilyChartData(input: {
  members: AdminFamilyTreeMember[];
  relationships: AdminFamilyTreeRelationship[];
}): FamilyChartGraph {
  const people = new Map<string, MutablePerson>();
  const warnings: AdminFamilyTreeWarning[] = [];

  for (const member of input.members) {
    people.set(member.id, {
      id: member.id,
      data: {
        gender: member.gender === "FEMALE" ? "F" : "M",
        ...splitName(member.fullName ?? member.alias ?? member.initials),
        fullName: member.fullName ?? member.alias ?? `Member ${member.id}`,
        alias: member.alias ?? "",
        initials: member.initials,
        member
      },
      rels: { parents: [], spouses: [], children: [] }
    });
  }

  const validated = validateFamilyTreeRelationships(input);
  warnings.push(...validated.warnings);
  const cycleWarnings = findParentChildCycleWarnings(validated.validRelationships);
  const cycleRelationshipIds = new Set(cycleWarnings.map((warning) => warning.relationshipId).filter(Boolean));
  warnings.push(...cycleWarnings);

  for (const relationship of validated.validRelationships) {
    if (cycleRelationshipIds.has(relationship.id)) continue;

    if (relationship.type === "FATHER" || relationship.type === "MOTHER") {
      addParentChild(people, relationship.fromMemberId, relationship.toMemberId);
      continue;
    }

    if (relationship.type === "CHILD") {
      addParentChild(people, relationship.toMemberId, relationship.fromMemberId);
      continue;
    }

    if (relationship.type === "SPOUSE") {
      addSpouse(people, relationship.fromMemberId, relationship.toMemberId);
    }
  }

  return {
    persons: Array.from(people.values()).map((person) => ({
      ...person,
      rels: {
        parents: unique(person.rels.parents),
        spouses: unique(person.rels.spouses),
        children: unique(person.rels.children)
      }
    })),
    warnings
  };
}

function addParentChild(people: Map<string, MutablePerson>, parentId: string, childId: string) {
  const parent = people.get(parentId);
  const child = people.get(childId);
  if (!parent || !child) return;
  parent.rels.children.push(childId);
  child.rels.parents.push(parentId);
}

function addSpouse(people: Map<string, MutablePerson>, firstId: string, secondId: string) {
  const first = people.get(firstId);
  const second = people.get(secondId);
  if (!first || !second) return;
  first.rels.spouses.push(secondId);
  second.rels.spouses.push(firstId);
}

function splitName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length <= 1) {
    return { firstName: parts[0] ?? "Unnamed", lastName: "" };
  }

  return {
    firstName: parts.slice(0, -1).join(" "),
    lastName: parts.at(-1) ?? ""
  };
}

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean)));
}
