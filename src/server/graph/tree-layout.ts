import type { TreeNodePosition } from "@/types/family-tree";
import type { GraphEdge } from "./family-graph";

export function calculateTreePositions(input: {
  memberIds: string[];
  focusMemberId: string;
  edges: GraphEdge[];
}): TreeNodePosition[] {
  const levels = new Map<string, number>([[input.focusMemberId, 0]]);
  const queue = [input.focusMemberId];

  while (queue.length > 0) {
    const memberId = queue.shift();
    if (!memberId) break;
    const level = levels.get(memberId) ?? 0;

    for (const edge of input.edges.filter((item) => item.from === memberId)) {
      if (levels.has(edge.to)) continue;
      const nextLevel =
        edge.type === "FATHER" || edge.type === "MOTHER" || edge.type === "GUARDIAN"
          ? level + 1
          : edge.type === "CHILD"
            ? level - 1
            : level;
      levels.set(edge.to, nextLevel);
      queue.push(edge.to);
    }
  }

  for (const edge of input.edges) {
    if (edge.type !== "SPOUSE") continue;
    const fromLevel = levels.get(edge.from);
    const toLevel = levels.get(edge.to);
    if (fromLevel !== undefined && toLevel === undefined) {
      levels.set(edge.to, fromLevel);
    }
    if (toLevel !== undefined && fromLevel === undefined) {
      levels.set(edge.from, toLevel);
    }
  }

  const grouped = new Map<number, string[]>();
  for (const memberId of input.memberIds) {
    const level = levels.get(memberId) ?? 0;
    grouped.set(level, [...(grouped.get(level) ?? []), memberId]);
  }

  for (const [level, memberIds] of grouped.entries()) {
    grouped.set(level, orderSpousesTogether(memberIds, input.edges));
  }

  const minLevel = Math.min(...[...grouped.keys(), 0]);

  return input.memberIds.map((memberId) => {
    const level = levels.get(memberId) ?? 0;
    const group = grouped.get(level) ?? [memberId];
    const index = group.indexOf(memberId);
    const offset = index - (group.length - 1) / 2;

    return {
      memberId,
      x: Math.round(offset * 220),
      y: (level - minLevel) * 180
    };
  });
}

function orderSpousesTogether(memberIds: string[], edges: GraphEdge[]) {
  const memberSet = new Set(memberIds);
  const spouseByMemberId = new Map<string, string[]>();
  for (const edge of edges) {
    if (edge.type !== "SPOUSE" || !memberSet.has(edge.from) || !memberSet.has(edge.to)) continue;
    spouseByMemberId.set(edge.from, [...(spouseByMemberId.get(edge.from) ?? []), edge.to]);
    spouseByMemberId.set(edge.to, [...(spouseByMemberId.get(edge.to) ?? []), edge.from]);
  }

  const ordered: string[] = [];
  const visited = new Set<string>();

  for (const memberId of memberIds) {
    if (visited.has(memberId)) continue;
    ordered.push(memberId);
    visited.add(memberId);

    for (const spouseId of spouseByMemberId.get(memberId) ?? []) {
      if (!visited.has(spouseId)) {
        ordered.push(spouseId);
        visited.add(spouseId);
      }
    }
  }

  return ordered;
}
