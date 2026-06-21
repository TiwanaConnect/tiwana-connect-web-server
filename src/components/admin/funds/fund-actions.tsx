"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function FundActions({ fundId }: { fundId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function run(action: "close" | "cancel" | "archive") {
    if (loadingAction) return;
    setLoadingAction(action);
    setMessage(null);
    try {
      const response = await fetch(`/api/admin/funds/${fundId}/${action}`, { method: "POST" });
      const json = await response.json();
      if (!response.ok) {
        const errorMessage = json.error?.message ?? "Request failed.";
        setMessage(errorMessage);
        toast.error(errorMessage);
        return;
      }
      const successMessage = `Fund ${action}d.`;
      setMessage(successMessage);
      toast.success(successMessage);
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button disabled={Boolean(loadingAction)} onClick={() => run("close")} className="rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">{loadingAction === "close" ? "Closing..." : "Close"}</button>
      <button disabled={Boolean(loadingAction)} onClick={() => run("cancel")} className="rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">{loadingAction === "cancel" ? "Cancelling..." : "Cancel"}</button>
      <button disabled={Boolean(loadingAction)} onClick={() => run("archive")} className="rounded-md border px-3 py-2 text-sm font-medium disabled:cursor-not-allowed disabled:opacity-60">{loadingAction === "archive" ? "Archiving..." : "Archive"}</button>
      {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
    </div>
  );
}
