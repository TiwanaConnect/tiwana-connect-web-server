"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function TransactionReviewActions({ transactionId }: { transactionId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function run(action: "confirm" | "reject") {
    if (loadingAction) return;
    setLoadingAction(action);
    setMessage(null);
    try {
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
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={Boolean(loadingAction)} onClick={() => run("confirm")} className="rounded-md border px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60">{loadingAction === "confirm" ? "Confirming..." : "Confirm"}</button>
      <button disabled={Boolean(loadingAction)} onClick={() => run("reject")} className="rounded-md border px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60">{loadingAction === "reject" ? "Rejecting..." : "Reject"}</button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}

export function RequestReviewActions({ requestId }: { requestId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function run(action: "waive" | "cancel") {
    if (loadingAction) return;
    setLoadingAction(action);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/funds/requests/${requestId}/${action}`, { method: "POST" });
      const json = await response.json();
      if (!response.ok) {
        setMessage(json.error?.message ?? "Request failed.");
        return;
      }
      setMessage(action === "waive" ? "Waived." : "Cancelled.");
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      <button disabled={Boolean(loadingAction)} onClick={() => run("waive")} className="rounded-md border px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60">{loadingAction === "waive" ? "Waiving..." : "Waive"}</button>
      <button disabled={Boolean(loadingAction)} onClick={() => run("cancel")} className="rounded-md border px-3 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-60">{loadingAction === "cancel" ? "Cancelling..." : "Cancel"}</button>
      {message ? <span className="text-xs text-muted-foreground">{message}</span> : null}
    </div>
  );
}
