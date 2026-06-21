"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { select, zoom as d3Zoom, zoomIdentity, type D3ZoomEvent } from "d3";

import type { FamilyTreeResponse, MemberNode } from "@/types/family-tree";

type ApiTreeResponse = {
  data: FamilyTreeResponse | null;
  error: { message: string } | null;
};

export function FamilyTreeDebugger({
  members
}: {
  members: Array<{ id: string; label: string }>;
}) {
  const [tree, setTree] = useState<FamilyTreeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);
  const [pan, setPan] = useState({ x: 520, y: 220 });
  const svgRef = useRef<SVGSVGElement | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;
    setLoading(true);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams({
      focusMemberId: String(data.get("focusMemberId") ?? ""),
      generations: String(data.get("generations") ?? "3"),
      viewMode: String(data.get("viewMode") ?? "close"),
      includeHiddenNames: "true"
    });
    const response = await fetch(`/api/admin/family-tree?${params}`);
    const json = (await response.json()) as ApiTreeResponse;
    setLoading(false);

    if (!response.ok || !json.data) {
      setMessage(json.error?.message ?? "Unable to load tree.");
      setTree(null);
      return;
    }

    setTree(json.data);
    setZoomScale(1);
    setPan({ x: 520, y: 220 });
  }

  const nodes = useMemo(() => {
    const positionById = new Map(tree?.positions.map((item) => [item.memberId, item]) ?? []);
    return (
      tree?.members.map((member) => ({
        member,
        position: positionById.get(member.id) ?? { memberId: member.id, x: 0, y: 0 }
      })) ?? []
    );
  }, [tree]);

  useEffect(() => {
    if (!svgRef.current) return;

    const selection = select(svgRef.current);
    const behavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.45, 2.5])
      .on("zoom", (event: D3ZoomEvent<SVGSVGElement, unknown>) => {
        setPan({ x: event.transform.x, y: event.transform.y });
        setZoomScale(event.transform.k);
      });

    selection.call(behavior);
    selection.call(behavior.transform, zoomIdentity.translate(520, 220).scale(1));

    return () => {
      selection.on(".zoom", null);
    };
  }, [tree]);

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="no-print grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_140px_160px_auto]">
        <select name="focusMemberId" className="rounded-md border bg-background px-3 py-2 text-sm">
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
            </option>
          ))}
        </select>
        <input name="generations" type="number" min={1} max={6} defaultValue={3} className="rounded-md border bg-background px-3 py-2 text-sm" />
        <select name="viewMode" defaultValue="close" className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="close">Close</option>
          <option value="branch">Branch</option>
          <option value="full">Full</option>
        </select>
        <button disabled={loading} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
          {loading ? "Loading..." : "Load Tree"}
        </button>
      </form>
      <div className="no-print flex flex-wrap gap-2">
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setZoomScale((value) => Math.min(value + 0.15, 2.5))}>Zoom in</button>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setZoomScale((value) => Math.max(value - 0.15, 0.45))}>Zoom out</button>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => { setZoomScale(1); setPan({ x: 520, y: 220 }); }}>Center/reset</button>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => window.print()}>Print Tree</button>
      </div>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
      <section id="print-tree-area" className="overflow-hidden rounded-lg border bg-card">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold">Tiwana Family Tree</h2>
          <p className="text-sm text-muted-foreground">
            {tree ? `${tree.meta.totalMembers} members · ${tree.meta.totalConnections} connections` : "Select a focus member to load the tree."}
          </p>
        </div>
        {tree && tree.members.length > 0 ? (
          <svg
            ref={svgRef}
            role="img"
            aria-label="Tiwana family tree"
            className="h-[680px] w-full cursor-grab bg-[radial-gradient(circle_at_1px_1px,hsl(var(--border))_1px,transparent_0)] [background-size:24px_24px]"
            viewBox="0 0 1100 720"
          >
            <g transform={`translate(${pan.x} ${pan.y}) scale(${zoomScale})`}>
              {tree.connections.map((connection) => {
                const from = tree.positions.find((item) => item.memberId === connection.fromMemberId);
                const to = tree.positions.find((item) => item.memberId === connection.toMemberId);
                if (!from || !to) return null;
                return (
                  <line
                    key={connection.id}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    className={connection.type === "spouse" ? "stroke-emerald-500" : "stroke-slate-400"}
                    strokeWidth={connection.type === "spouse" ? 3 : 2}
                    strokeDasharray={connection.type === "spouse" ? "8 6" : undefined}
                  />
                );
              })}
              {nodes.map(({ member, position }) => (
                <TreeNode key={member.id} member={member} x={position.x} y={position.y} focused={member.id === tree.focusMemberId} />
              ))}
            </g>
          </svg>
        ) : (
          <div className="p-8 text-sm text-muted-foreground">
            Empty or standalone tree. Load a member to render a one-node tree.
          </div>
        )}
      </section>
    </div>
  );
}

function TreeNode({
  member,
  x,
  y,
  focused
}: {
  member: MemberNode;
  x: number;
  y: number;
  focused: boolean;
}) {
  return (
    <g transform={`translate(${x - 92} ${y - 54})`}>
      <rect
        width="184"
        height="108"
        rx="8"
        className={focused ? "fill-emerald-50 stroke-emerald-600" : "fill-white stroke-slate-300"}
        strokeWidth={focused ? 3 : 1.5}
      />
      <text x="14" y="26" className="fill-slate-950 text-sm font-semibold">
        {truncate(member.displayName, 22)}
      </text>
      {member.alias ? (
        <text x="14" y="46" className="fill-slate-500 text-xs">
          {truncate(member.alias, 24)}
        </text>
      ) : null}
      <text x="14" y="68" className="fill-slate-600 text-xs">
        {member.gender} · {member.visibility}
      </text>
      <text x="14" y="88" className="fill-slate-600 text-xs">
        {truncate(member.city ?? member.branchLabel ?? "", 24)}
      </text>
      {member.isFamilyHead ? <Badge x={116} y={72} label="Head" /> : null}
      {member.isAdmin ? <Badge x={112} y={12} label="Admin" /> : null}
      {member.isPresident ? <Badge x={92} y={12} label="President" /> : null}
    </g>
  );
}

function Badge({ x, y, label }: { x: number; y: number; label: string }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <rect width={label.length * 7 + 16} height="20" rx="10" className="fill-emerald-100" />
      <text x="8" y="14" className="fill-emerald-700 text-[10px] font-semibold">
        {label}
      </text>
    </g>
  );
}

function truncate(value: string, max: number) {
  return value.length > max ? `${value.slice(0, max - 1)}...` : value;
}
