"use client";

import { useState } from "react";

import type { RelationshipTreeResponse } from "@/types/family-tree";

type ApiRelationshipResponse = {
  data: RelationshipTreeResponse | null;
  error: { message: string } | null;
};

export function RelationshipDebugger({
  members
}: {
  members: Array<{ id: string; label: string }>;
}) {
  const [result, setResult] = useState<RelationshipTreeResponse | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams({
      startMemberId: String(data.get("startMemberId") ?? ""),
      targetMemberId: String(data.get("targetMemberId") ?? "")
    });
    const response = await fetch(`/api/admin/family-tree/relationship?${params}`);
    const json = (await response.json()) as ApiRelationshipResponse;

    if (!response.ok || !json.data) {
      setResult(null);
      setMessage(json.error?.message ?? "Unable to find relationship.");
      return;
    }

    setResult(json.data);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-[1fr_1fr_auto]">
        <select name="startMemberId" className="rounded-md border bg-background px-3 py-2 text-sm">
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
            </option>
          ))}
        </select>
        <select name="targetMemberId" className="rounded-md border bg-background px-3 py-2 text-sm">
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.label}
            </option>
          ))}
        </select>
        <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Find Relationship
        </button>
      </form>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
      {result ? (
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Summary label="Relationship" value={result.relationshipLabel} />
            <Summary label="Local label" value={result.localRelationshipLabel ?? "-"} />
            <Summary label="Side" value={result.side} />
            <Summary label="Path length" value={`${result.pathMemberIds.length} members`} />
          </div>
          <div>
            <h2 className="font-semibold">Path</h2>
            <p className="mt-2 rounded-md bg-muted p-3 text-sm">{result.pathText}</p>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {result.pathMemberIds.map((memberId) => {
              const member = result.tree.members.find((item) => item.id === memberId);
              return (
                <div key={memberId} className="rounded-md border p-4 text-sm">
                  <p className="font-medium">{member?.displayName ?? memberId}</p>
                  <p className="text-muted-foreground">{member?.gender} · {member?.visibility}</p>
                  {member?.city ? <p className="text-muted-foreground">{member.city}</p> : null}
                </div>
              );
            })}
          </div>
        </section>
      ) : null}
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/30 p-4">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
