import type {
  FamilyRelationship,
  FamilyRelationshipType,
  Member,
  UserAccount
} from "@prisma/client";

export type GraphMember = Member & {
  userAccount?: UserAccount | null;
};

export type GraphEdge = {
  from: string;
  to: string;
  type: FamilyRelationshipType;
  relationshipId: string;
};

export type FamilyGraph = {
  membersById: Map<string, GraphMember>;
  adjacency: Map<string, GraphEdge[]>;
  relationships: FamilyRelationship[];
};

function reverseType(type: FamilyRelationshipType): FamilyRelationshipType {
  if (type === "FATHER" || type === "MOTHER" || type === "GUARDIAN") {
    return "CHILD";
  }

  if (type === "CHILD") {
    return "OTHER";
  }

  return type;
}

function addEdge(adjacency: Map<string, GraphEdge[]>, edge: GraphEdge) {
  const edges = adjacency.get(edge.from) ?? [];
  const exists = edges.some(
    (item) =>
      item.to === edge.to &&
      item.type === edge.type &&
      item.relationshipId === edge.relationshipId
  );

  if (!exists) {
    edges.push(edge);
    adjacency.set(edge.from, edges);
  }
}

export function buildFamilyGraph(input: {
  members: GraphMember[];
  relationships: FamilyRelationship[];
}): FamilyGraph {
  const membersById = new Map(input.members.map((member) => [member.id, member]));
  const adjacency = new Map<string, GraphEdge[]>();

  for (const relationship of input.relationships) {
    if (
      !membersById.has(relationship.fromMemberId) ||
      !membersById.has(relationship.toMemberId)
    ) {
      continue;
    }

    addEdge(adjacency, {
      from: relationship.fromMemberId,
      to: relationship.toMemberId,
      type: relationship.type,
      relationshipId: relationship.id
    });
    addEdge(adjacency, {
      from: relationship.toMemberId,
      to: relationship.fromMemberId,
      type: reverseType(relationship.type),
      relationshipId: relationship.id
    });
  }

  return {
    membersById,
    adjacency,
    relationships: input.relationships
  };
}

export function findRelationshipPath(
  graph: FamilyGraph,
  startMemberId: string,
  targetMemberId: string
) {
  if (startMemberId === targetMemberId) {
    return { memberIds: [startMemberId], edges: [] as GraphEdge[] };
  }

  const queue: Array<{ memberId: string; memberIds: string[]; edges: GraphEdge[] }> = [
    { memberId: startMemberId, memberIds: [startMemberId], edges: [] }
  ];
  const visited = new Set<string>([startMemberId]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) break;

    const edges = [...(graph.adjacency.get(current.memberId) ?? [])].sort(
      (a, b) => edgeWeight(a.type) - edgeWeight(b.type)
    );

    for (const edge of edges) {
      if (visited.has(edge.to)) {
        continue;
      }

      const next = {
        memberId: edge.to,
        memberIds: [...current.memberIds, edge.to],
        edges: [...current.edges, edge]
      };

      if (edge.to === targetMemberId) {
        return { memberIds: next.memberIds, edges: next.edges };
      }

      visited.add(edge.to);
      queue.push(next);
    }
  }

  return null;
}

function edgeWeight(type: FamilyRelationshipType) {
  if (type === "FATHER" || type === "MOTHER" || type === "CHILD") return 1;
  if (type === "SIBLING") return 2;
  if (type === "SPOUSE") return 3;
  return 5;
}
