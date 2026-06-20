import type { FamilyRelationshipType } from "@prisma/client";
import type { FamilyGraph, GraphEdge } from "./family-graph";

export function buildRelationshipLabel(input: {
  memberIds: string[];
  edges: GraphEdge[];
  graph: FamilyGraph;
}) {
  const { memberIds, edges, graph } = input;

  if (memberIds.length <= 1) {
    return label("Self", null, "unknown");
  }

  if (edges.length === 1) {
    const edge = edges[0];
    if (edge.type === "FATHER") return label("Father", "Walid", "father");
    if (edge.type === "MOTHER") return label("Mother", "Walida", "mother");
    if (edge.type === "SPOUSE") return label("Spouse", null, "spouse");
    if (edge.type === "CHILD") {
      const target = graph.membersById.get(edge.to);
      return label(target?.gender === "FEMALE" ? "Daughter" : "Son", null, "unknown");
    }
    if (edge.type === "SIBLING") {
      const target = graph.membersById.get(edge.to);
      return label(target?.gender === "FEMALE" ? "Sister" : "Brother", null, "both");
    }
  }

  if (edges.length === 2) {
    const [first, second] = edges;
    if (isParent(first.type) && isParent(second.type)) {
      return label(second.type === "MOTHER" ? "Grandmother" : "Grandfather", null, sideFor(first.type));
    }
    if (first.type === "CHILD" && isParent(second.type)) {
      const target = graph.membersById.get(second.to);
      return label(target?.gender === "FEMALE" ? "Sister" : "Brother", null, "both");
    }
    if (isParent(first.type) && second.type === "CHILD") {
      const target = graph.membersById.get(second.to);
      const side = sideFor(first.type);
      if (target?.gender === "FEMALE") {
        return label(
          side === "father" ? "Paternal Aunt" : "Maternal Aunt",
          side === "father" ? "Phupo" : "Khala",
          side
        );
      }
      return label(
        side === "father" ? "Paternal Uncle" : "Maternal Uncle",
        side === "father" ? "Chacha" : "Mama",
        side
      );
    }
  }

  if (edges.length === 3) {
    const side = firstParentSide(edges);
    if (side !== "unknown") {
      return label(side === "father" ? "Paternal Cousin" : "Maternal Cousin", "Cousin", side);
    }
    return label("Cousin", "Cousin", "unknown");
  }

  const side = firstParentSide(edges);
  if (side === "father") return label("Father's side", null, "father");
  if (side === "mother") return label("Mother's side", null, "mother");

  return label("Family relative", null, "unknown");
}

function label(
  relationshipLabel: string,
  localRelationshipLabel: string | null,
  side: "father" | "mother" | "both" | "spouse" | "unknown"
) {
  return { relationshipLabel, localRelationshipLabel, side };
}

function isParent(type: FamilyRelationshipType) {
  return type === "FATHER" || type === "MOTHER";
}

function sideFor(type: FamilyRelationshipType) {
  if (type === "FATHER") return "father" as const;
  if (type === "MOTHER") return "mother" as const;
  return "unknown" as const;
}

function firstParentSide(edges: GraphEdge[]) {
  const firstParent = edges.find((edge) => isParent(edge.type));
  return firstParent ? sideFor(firstParent.type) : "unknown";
}
