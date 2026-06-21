"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

function toDatetimeLocal(value: string | Date | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (part: number) => String(part).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function ElectionForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const payload = {
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      positionTitle: String(data.get("positionTitle") ?? "President"),
      nominationStartAt: new Date(String(data.get("nominationStartAt"))).toISOString(),
      nominationEndAt: new Date(String(data.get("nominationEndAt"))).toISOString(),
      votingStartAt: new Date(String(data.get("votingStartAt"))).toISOString(),
      votingEndAt: new Date(String(data.get("votingEndAt"))).toISOString()
    };
    const response = await fetch("/api/admin/elections", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }
    router.push(`/admin/elections/${json.data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-lg border bg-card p-6">
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Basic Details</h2>
          <p className="text-sm text-muted-foreground">Name the election and the position being authorized.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">
            Election title
            <input name="title" required placeholder="President Election 2026" className="w-full rounded-md border bg-background px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Position title
            <input name="positionTitle" defaultValue="President" className="w-full rounded-md border bg-background px-3 py-2" />
          </label>
        </div>
        <label className="block space-y-1 text-sm font-medium">
          Description
          <textarea name="description" rows={3} placeholder="Explain the purpose and expectations for this election." className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Nomination Timeline</h2>
          <p className="text-sm text-muted-foreground">Members can submit nominations only inside this window.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">
            Nominations open
            <input name="nominationStartAt" required type="datetime-local" className="w-full rounded-md border bg-background px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Nominations close
            <input name="nominationEndAt" required type="datetime-local" className="w-full rounded-md border bg-background px-3 py-2" />
          </label>
        </div>
      </section>
      <section className="space-y-4">
        <div>
          <h2 className="font-semibold">Voting And Result Timeline</h2>
          <p className="text-sm text-muted-foreground">After creation, these dates are managed by extension only until the election is completed.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1 text-sm font-medium">
            Voting opens
            <input name="votingStartAt" required type="datetime-local" className="w-full rounded-md border bg-background px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Voting closes
            <input name="votingEndAt" required type="datetime-local" className="w-full rounded-md border bg-background px-3 py-2" />
          </label>
        </div>
      </section>
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Create election</button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

export function ElectionActionButton({ href, label, body }: { href: string; label: string; body?: unknown }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  async function run() {
    setMessage(null);
    const response = await fetch(href, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }
    setMessage("Done.");
    router.refresh();
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={run} className="rounded-md border px-3 py-2 text-sm font-medium">{label}</button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </span>
  );
}

export function TimelineCheckpointForm({
  electionId,
  phaseType,
  value
}: {
  electionId: string;
  phaseType: string;
  value: string | Date | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/elections/${electionId}/phases/${phaseType}/extend`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        newStartsAt: data.get("checkpointAt") ? new Date(String(data.get("checkpointAt"))).toISOString() : "",
        reason: "Timeline checkpoint updated by admin."
      })
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }
    setMessage("Date saved.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <input name="checkpointAt" required type="datetime-local" defaultValue={toDatetimeLocal(value)} className="min-w-64 rounded-md border bg-background px-3 py-2 text-sm" />
      <button className="rounded-md border px-3 py-2 text-sm font-medium">Extend</button>
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </form>
  );
}
