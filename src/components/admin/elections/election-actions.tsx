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
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
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
    try {
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
    } finally {
      setIsSubmitting(false);
    }
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
      <button disabled={isSubmitting} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Creating..." : "Create election"}
      </button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

export function ElectionActionButton({ href, label, body }: { href: string; label: string; body?: unknown }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  async function run() {
    if (isLoading) return;
    setIsLoading(true);
    setMessage(null);
    try {
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
    } finally {
      setIsLoading(false);
    }
  }
  return (
    <span className="inline-flex items-center gap-2">
      <button disabled={isLoading} onClick={run} className="rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
        {isLoading ? "Working..." : label}
      </button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </span>
  );
}

export function ElectionTimelineForm({
  electionId,
  nominationStartAt,
  nominationEndAt,
  votingStartAt,
  votingEndAt,
  disabled
}: {
  electionId: string;
  nominationStartAt: string | Date;
  nominationEndAt: string | Date;
  votingStartAt: string | Date;
  votingEndAt: string | Date;
  disabled?: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    try {
      const response = await fetch(`/api/admin/elections/${electionId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          nominationStartAt: new Date(String(data.get("nominationStartAt"))).toISOString(),
          nominationEndAt: new Date(String(data.get("nominationEndAt"))).toISOString(),
          votingStartAt: new Date(String(data.get("votingStartAt"))).toISOString(),
          votingEndAt: new Date(String(data.get("votingEndAt"))).toISOString()
        })
      });
      const json = await response.json();
      if (!response.ok) {
        setMessage(json.error?.message ?? "Request failed.");
        return;
      }
      setMessage("Timeline dates saved.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Nominations open
          <input name="nominationStartAt" required disabled={disabled} type="datetime-local" defaultValue={toDatetimeLocal(nominationStartAt)} className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:bg-muted" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Nominations close
          <input name="nominationEndAt" required disabled={disabled} type="datetime-local" defaultValue={toDatetimeLocal(nominationEndAt)} className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:bg-muted" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Voting opens
          <input name="votingStartAt" required disabled={disabled} type="datetime-local" defaultValue={toDatetimeLocal(votingStartAt)} className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:bg-muted" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Voting closes
          <input name="votingEndAt" required disabled={disabled} type="datetime-local" defaultValue={toDatetimeLocal(votingEndAt)} className="w-full rounded-md border bg-background px-3 py-2 text-sm disabled:bg-muted" />
        </label>
      </div>
      {!disabled ? (
        <button disabled={isSubmitting} className="rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? "Saving..." : "Save dates"}
        </button>
      ) : null}
      {message ? <p className="text-xs text-muted-foreground">{message}</p> : null}
    </form>
  );
}
