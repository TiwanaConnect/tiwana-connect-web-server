"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

export function EventActions({
  eventId,
  isPinned
}: {
  eventId: string;
  isPinned: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function post(path: string, body?: unknown) {
    if (loadingAction) return;
    setLoadingAction(path);
    try {
      const response = await fetch(path, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      const json = await response.json();
      const message = response.ok ? "Updated." : json.error?.message ?? "Request failed.";
      setMessage(message);
      if (response.ok) toast.success(message);
      else toast.error(message);
      router.refresh();
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <button disabled={Boolean(loadingAction)} className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" onClick={() => post(`/api/admin/events/${eventId}/${isPinned ? "unpin" : "pin"}`)}>
          {loadingAction?.includes(isPinned ? "unpin" : "pin") ? "Working..." : isPinned ? "Unpin" : "Pin"}
        </button>
        <button disabled={Boolean(loadingAction)} className="rounded-md border px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-60" onClick={() => post(`/api/admin/events/${eventId}/cancel`, { reason: "Cancelled by admin" })}>
          {loadingAction?.includes("cancel") ? "Cancelling..." : "Cancel"}
        </button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
