"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function FundActions({ fundId }: { fundId: string }) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function run(action: "close" | "cancel" | "archive") {
    setMessage(null);
    const response = await fetch(`/api/admin/funds/${fundId}/${action}`, { method: "POST" });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }
    setMessage(`Fund ${action}d.`);
    router.refresh();
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button onClick={() => run("close")} className="rounded-md border px-3 py-2 text-sm font-medium">Close</button>
      <button onClick={() => run("cancel")} className="rounded-md border px-3 py-2 text-sm font-medium">Cancel</button>
      <button onClick={() => run("archive")} className="rounded-md border px-3 py-2 text-sm font-medium">Archive</button>
      {message ? <span className="text-sm text-muted-foreground">{message}</span> : null}
    </div>
  );
}
