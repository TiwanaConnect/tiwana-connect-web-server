import type { UserRole } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import type { FamilyTreeResponse, TreeViewMode } from "@/types/family-tree";
import { buildTreeConnections } from "@/server/graph/connection-utils";
import {
  buildFamilyGraph,
  type FamilyGraph,
  type GraphEdge
} from "@/server/graph/family-graph";
import { calculateTreePositions } from "@/server/graph/tree-layout";
import {
  listFamilyHeads,
  listStandaloneMembers,
  loadFamilyGraphData
} from "@/server/repositories/family-tree.repository";
import { toAdminMemberDto } from "@/server/dto/member.dto";

import { toMemberNode } from "./member-privacy.service";

const MOBILE_FULL_TREE_LIMIT = 150;

function compactMembers<T>(members: Array<T | undefined>): T[] {
  return members.filter((member): member is T => Boolean(member));
}

export async function loadGraph(options?: {
  includeDeleted?: boolean;
  includeBlocked?: boolean;
}) {
  return buildFamilyGraph(await loadFamilyGraphData(options));
}

export async function buildFamilyTreeForMember(input: {
  viewer: { memberId: string; role: UserRole };
  focusMemberId?: string;
  generationDepth: number;
  viewMode: TreeViewMode;
  includeHiddenNames?: boolean;
}): Promise<FamilyTreeResponse> {
  const focusMemberId = input.focusMemberId ?? input.viewer.memberId;
  const graph = await loadGraph({
    includeBlocked: input.viewer.role === "SUPER_ADMIN",
    includeDeleted: false
  });

  if (!graph.membersById.has(focusMemberId)) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Focus member not found.", 404);
  }

  if (
    input.viewMode === "full" &&
    input.viewer.role !== "SUPER_ADMIN" &&
    graph.membersById.size > MOBILE_FULL_TREE_LIMIT
  ) {
    throw new AppError(
      API_ERROR_CODES.TREE_TOO_LARGE,
      "Full tree is too large. Use close or branch view.",
      400
    );
  }

  const selected = selectTreeMembers({
    graph,
    focusMemberId,
    depth:
      input.viewMode === "full"
        ? 99
        : input.viewMode === "branch"
          ? Math.max(input.generationDepth, 4)
          : input.generationDepth
  });
  const memberIds = [...selected.memberIds];
  const memberSet = new Set(memberIds);
  const relationships = graph.relationships.filter(
    (relationship) =>
      memberSet.has(relationship.fromMemberId) && memberSet.has(relationship.toMemberId)
  );
  const connections = buildTreeConnections(memberSet, relationships);
  const nodes = compactMembers(memberIds.map((memberId) => graph.membersById.get(memberId)))
    .map((member) =>
      toMemberNode({
        member,
        viewerRole: input.viewer.role,
        currentUserId: input.viewer.memberId,
        relationshipLabel: member.id === focusMemberId ? "Self" : "Relative",
        includeHiddenNames: input.includeHiddenNames
      })
    );
  const standaloneMemberIds =
    selected.edgeList.length === 0 && memberSet.has(focusMemberId)
      ? [focusMemberId]
      : undefined;

  return {
    rootMemberId: focusMemberId,
    currentUserId: input.viewer.memberId,
    focusMemberId,
    members: nodes,
    positions: calculateTreePositions({
      memberIds,
      focusMemberId,
      edges: selected.edgeList
    }),
    connections,
    expandedMemberIds: memberIds,
    standaloneMemberIds,
    meta: {
      generationDepth: input.generationDepth,
      viewMode: input.viewMode,
      totalMembers: nodes.length,
      totalConnections: connections.length
    }
  };
}

function selectTreeMembers(input: {
  graph: FamilyGraph;
  focusMemberId: string;
  depth: number;
}) {
  const memberIds = new Set<string>([input.focusMemberId]);
  const edgeList: GraphEdge[] = [];
  const queue: Array<{ memberId: string; depth: number }> = [
    { memberId: input.focusMemberId, depth: 0 }
  ];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current || current.depth >= input.depth) continue;

    for (const edge of input.graph.adjacency.get(current.memberId) ?? []) {
      if (!memberIds.has(edge.to)) {
        memberIds.add(edge.to);
        queue.push({ memberId: edge.to, depth: current.depth + 1 });
      }
      edgeList.push(edge);
    }
  }

  return { memberIds, edgeList };
}

export function buildRelationshipTree(input: {
  graph: FamilyGraph;
  viewer: { memberId: string; role: UserRole };
  focusMemberId: string;
  pathMemberIds: string[];
  pathEdges: GraphEdge[];
  generationDepth?: number;
  includeHiddenNames?: boolean;
}): FamilyTreeResponse {
  const memberIds = new Set(input.pathMemberIds);
  const contextEdges = [...input.pathEdges];

  for (const memberId of input.pathMemberIds) {
    for (const edge of input.graph.adjacency.get(memberId) ?? []) {
      if (memberIds.size < input.pathMemberIds.length + 6) {
        memberIds.add(edge.to);
        contextEdges.push(edge);
      }
    }
  }

  const memberIdList = [...memberIds];
  const relationshipIds = new Set(contextEdges.map((edge) => edge.relationshipId));
  const relationships = input.graph.relationships.filter((relationship) =>
    relationshipIds.has(relationship.id)
  );
  const connections = buildTreeConnections(new Set(memberIdList), relationships);

  return {
    rootMemberId: input.focusMemberId,
    currentUserId: input.viewer.memberId,
    focusMemberId: input.focusMemberId,
    members: compactMembers(
      memberIdList.map((memberId) => input.graph.membersById.get(memberId))
    )
      .map((member) =>
        toMemberNode({
          member,
          viewerRole: input.viewer.role,
          currentUserId: input.viewer.memberId,
          relationshipLabel: member.id === input.focusMemberId ? "Self" : "Relative",
          includeHiddenNames: input.includeHiddenNames
        })
      ),
    positions: calculateTreePositions({
      memberIds: memberIdList,
      focusMemberId: input.focusMemberId,
      edges: contextEdges
    }),
    connections,
    expandedMemberIds: memberIdList,
    meta: {
      generationDepth: input.generationDepth ?? 3,
      viewMode: "relationship",
      totalMembers: memberIdList.length,
      totalConnections: connections.length
    }
  };
}

export async function getStandaloneMembers() {
  return (await listStandaloneMembers()).map(toAdminMemberDto);
}

export async function getFamilyHeads() {
  return (await listFamilyHeads()).map(toAdminMemberDto);
}
