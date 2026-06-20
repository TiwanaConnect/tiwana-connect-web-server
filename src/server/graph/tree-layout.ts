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
        edge.type === "FATHER" || edge.type === "MOTHER"
          ? level - 1
          : edge.type === "CHILD"
            ? level + 1
            : level;
      levels.set(edge.to, nextLevel);
      queue.push(edge.to);
    }
  }

  const grouped = new Map<number, string[]>();
  for (const memberId of input.memberIds) {
    const level = levels.get(memberId) ?? 0;
    grouped.set(level, [...(grouped.get(level) ?? []), memberId]);
  }

  return input.memberIds.map((memberId) => {
    const level = levels.get(memberId) ?? 0;
    const group = grouped.get(level) ?? [memberId];
    const index = group.indexOf(memberId);
    const offset = index - (group.length - 1) / 2;

    return {
      memberId,
      x: Math.round(offset * 220),
      y: level * 180
    };
  });
}
