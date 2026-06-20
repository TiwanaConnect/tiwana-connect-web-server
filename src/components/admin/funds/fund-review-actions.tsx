"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TransactionReviewActions({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: "confirm" | "reject") {
    setMessage(null);
    const response = await fetch(`/api/admin/funds/transactions/${transactionId}/${action}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: action === "reject" ? JSON.stringify({ reason: "Rejected from admin queue." }) : undefined
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }
    setMessage(action === "confirm" ? "Confirmed." : "Rejected.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => run("confirm")} className="rounded-md border px-3 py-1 text-xs font-medium">Confirm</button>
      <button onClick={() => run("reject")} className="rounded-md border px-3 py-1 text-xs font-medium">Reject</button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}

export function RequestReviewActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: "waive" | "cancel") {
    setMessage(null);
    const response = await fetch(`/api/admin/funds/requests/${requestId}/${action}`, { method: "POST" });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }
    setMessage(action === "waive" ? "Waived." : "Cancelled.");
    router.refresh();
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button onClick={() => run("waive")} className="rounded-md border px-3 py-1 text-xs font-medium">Waive</button>
      <button onClick={() => run("cancel")} className="rounded-md border px-3 py-1 text-xs font-medium">Cancel</button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
