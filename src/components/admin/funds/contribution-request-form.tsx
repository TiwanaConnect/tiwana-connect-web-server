"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type Props = {
  fundId: string;
  members: Array<{ id: string; label: string }>;
};

export function ContributionRequestForm({ fundId, members }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const payload = {
      memberIds: data.getAll("memberIds").map(String).filter(Boolean),
      requestedAmount: String(data.get("requestedAmount") ?? ""),
      currency: String(data.get("currency") ?? "PKR"),
      note: String(data.get("note") ?? "")
    };
    const response = await fetch(`/api/admin/funds/${fundId}/requests`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!response.ok) {
      const errorMessage = json.error?.message ?? "Request failed.";
      setMessage(errorMessage);
      toast.error(errorMessage);
      return;
    }
    setMessage("Contribution requests saved.");
    toast.success("Contribution requests saved.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">Create Requests</h2>
      <div className="grid gap-3 md:grid-cols-[1fr_160px_100px]">
        <select name="memberIds" multiple required className="h-40 rounded-md border bg-background px-3 py-2 text-sm">
          {members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
        </select>
        <input name="requestedAmount" type="number" min="0.01" step="0.01" placeholder="Amount" className="h-10 rounded-md border bg-background px-3 py-2 text-sm" />
        <input name="currency" defaultValue="PKR" maxLength={3} className="h-10 rounded-md border bg-background px-3 py-2 text-sm" />
      </div>
      <textarea name="note" rows={2} placeholder="Note" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Create requests</button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
