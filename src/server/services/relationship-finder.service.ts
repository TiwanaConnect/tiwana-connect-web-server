import type { UserRole } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { getMemberDisplayNameForViewer } from "@/lib/privacy/member-display";
import type { RelationshipTreeResponse } from "@/types/family-tree";
import { findRelationshipPath } from "@/server/graph/family-graph";
import { buildRelationshipLabel } from "@/server/graph/relationship-labels";

import { buildRelationshipTree, loadGraph } from "./family-tree.service";

export async function findRelationship(input: {
  viewer: { memberId: string; role: UserRole };
  startMemberId?: string;
  targetMemberId: string;
  allowAnyStart?: boolean;
  includeHiddenNames?: boolean;
}): Promise<RelationshipTreeResponse> {
  const startMemberId = input.startMemberId ?? input.viewer.memberId;

  if (!input.allowAnyStart && startMemberId !== input.viewer.memberId) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "You can only search from yourself.", 403);
  }

  const graph = await loadGraph({
    includeBlocked: input.viewer.role === "SUPER_ADMIN",
    includeDeleted: false
  });

  if (!graph.membersById.has(startMemberId)) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Start member not found.", 404);
  }

  if (!graph.membersById.has(input.targetMemberId)) {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Target member not found.", 404);
  }

  const path = findRelationshipPath(graph, startMemberId, input.targetMemberId);

  if (!path) {
    return {
      startMemberId,
      targetMemberId: input.targetMemberId,
      relationshipLabel: "No direct relationship found",
      localRelationshipLabel: null,
      side: "unknown",
      pathText: "No direct relationship found",
      pathMemberIds: [startMemberId, input.targetMemberId],
      pathConnectionIds: [],
      tree: buildRelationshipTree({
        graph,
        viewer: input.viewer,
        focusMemberId: startMemberId,
        pathMemberIds: [startMemberId, input.targetMemberId],
        pathEdges: [],
        includeHiddenNames: input.includeHiddenNames
      })
    };
  }

  const label = buildRelationshipLabel({
    memberIds: path.memberIds,
    edges: path.edges,
    graph
  });
  const pathText = path.memberIds
    .map((memberId, index) => {
      const member = graph.membersById.get(memberId);
      if (!member) return "Unknown";
      if (index === 0 && memberId === input.viewer.memberId) return "You";
      return getMemberDisplayNameForViewer(
        member,
        input.includeHiddenNames ? "SUPER_ADMIN" : input.viewer.role
      );
    })
    .join(" → ");

  return {
    startMemberId,
    targetMemberId: input.targetMemberId,
    relationshipLabel: label.relationshipLabel,
    localRelationshipLabel: label.localRelationshipLabel,
    side: label.side,
    pathText,
    pathMemberIds: path.memberIds,
    pathConnectionIds: path.edges.map((edge) => edge.relationshipId),
    tree: buildRelationshipTree({
      graph,
      viewer: input.viewer,
      focusMemberId: startMemberId,
      pathMemberIds: path.memberIds,
      pathEdges: path.edges,
      includeHiddenNames: input.includeHiddenNames
    })
  };
}
