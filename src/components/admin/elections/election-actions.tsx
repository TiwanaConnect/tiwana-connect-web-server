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
      approvalDeadlineAt: data.get("approvalDeadlineAt") ? new Date(String(data.get("approvalDeadlineAt"))).toISOString() : "",
      candidatesAnnouncedAt: data.get("candidatesAnnouncedAt") ? new Date(String(data.get("candidatesAnnouncedAt"))).toISOString() : "",
      votingStartAt: new Date(String(data.get("votingStartAt"))).toISOString(),
      votingEndAt: new Date(String(data.get("votingEndAt"))).toISOString(),
      resultAnnouncedAt: data.get("resultAnnouncedAt") ? new Date(String(data.get("resultAnnouncedAt"))).toISOString() : "",
      ceremonyAt: data.get("ceremonyAt") ? new Date(String(data.get("ceremonyAt"))).toISOString() : ""
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
          <label className="space-y-1 text-sm font-medium">
            Approval deadline
            <input name="approvalDeadlineAt" type="datetime-local" className="w-full rounded-md border bg-background px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            Candidate announcement time
            <input name="candidatesAnnouncedAt" type="datetime-local" className="w-full rounded-md border bg-background px-3 py-2" />
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
          <label className="space-y-1 text-sm font-medium">
            Result announcement
            <input name="resultAnnouncedAt" type="datetime-local" className="w-full rounded-md border bg-background px-3 py-2" />
          </label>
          <label className="space-y-1 text-sm font-medium">
            President authorization ceremony
            <input name="ceremonyAt" type="datetime-local" className="w-full rounded-md border bg-background px-3 py-2" />
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

export function ExtendPhaseForm({
  electionId,
  phaseType,
  defaultStartsAt,
  defaultEndsAt
}: {
  electionId: string;
  phaseType: string;
  defaultStartsAt: string | null;
  defaultEndsAt: string | null;
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
        newStartsAt: data.get("newStartsAt") ? new Date(String(data.get("newStartsAt"))).toISOString() : "",
        newEndsAt: data.get("newEndsAt") ? new Date(String(data.get("newEndsAt"))).toISOString() : "",
        reason: String(data.get("reason") ?? "")
      })
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }
    setMessage("Phase extended.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-2 md:grid-cols-[1fr_1fr_1.5fr_auto]">
      <input name="newStartsAt" type="datetime-local" defaultValue={toDatetimeLocal(defaultStartsAt)} className="rounded-md border bg-background px-3 py-2 text-sm" />
      <input name="newEndsAt" type="datetime-local" defaultValue={toDatetimeLocal(defaultEndsAt)} className="rounded-md border bg-background px-3 py-2 text-sm" />
      <input name="reason" required placeholder="Extension reason" className="rounded-md border bg-background px-3 py-2 text-sm" />
      <button className="rounded-md border px-3 py-2 text-sm font-medium">Extend</button>
      {message ? <p className="text-xs text-muted-foreground md:col-span-4">{message}</p> : null}
    </form>
  );
}
