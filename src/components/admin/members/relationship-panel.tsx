"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function RelationshipPanel({ memberId }: { memberId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const data = new FormData(event.currentTarget);
      const response = await fetch(`/api/admin/members/${memberId}/relationships`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          toMemberId: data.get("toMemberId"),
          type: data.get("type")
        })
      });
      const json = await response.json();

      setMessage(response.ok ? "Relationship added." : json.error?.message ?? "Request failed.");
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-md border bg-muted/30 p-4 md:grid-cols-[1fr_180px_auto]">
      <input name="toMemberId" placeholder="Target member id" className="rounded-md border bg-background px-3 py-2 text-sm" />
      <select name="type" className="rounded-md border bg-background px-3 py-2 text-sm">
        {["FATHER", "MOTHER", "SPOUSE", "CHILD", "SIBLING", "GUARDIAN", "OTHER"].map((type) => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>
      <button disabled={isSubmitting} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Adding..." : "Add"}
      </button>
      {message ? <p className="text-sm text-muted-foreground md:col-span-3">{message}</p> : null}
    </form>
  );
}
