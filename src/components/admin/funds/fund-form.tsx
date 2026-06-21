"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type FundFormProps = {
  mode: "create" | "edit";
  fund?: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    status: string;
    visibility: string;
    targetAmount: string | null;
    currency: string;
    isOfficial: boolean;
    isPinned: boolean;
    startAt: string | Date | null;
    endAt: string | Date | null;
    relatedEventId: string | null;
  };
};

function toDatetimeLocal(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

export function FundForm({ mode, fund }: FundFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const isEdit = mode === "edit" && fund;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const payload = {
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      type: "FAMILY_GENERAL",
      status: String(data.get("status") ?? "ACTIVE"),
      visibility: String(data.get("visibility") ?? "ALL_FAMILY"),
      targetAmount: String(data.get("targetAmount") ?? ""),
      currency: String(data.get("currency") ?? "PKR"),
      isOfficial: data.get("isOfficial") === "on",
      isPinned: data.get("isPinned") === "on",
      startAt: data.get("startAt") ? new Date(String(data.get("startAt"))).toISOString() : "",
      endAt: data.get("endAt") ? new Date(String(data.get("endAt"))).toISOString() : "",
      relatedEventId: String(data.get("relatedEventId") ?? "")
    };
    const response = await fetch(isEdit ? `/api/admin/funds/${fund.id}` : "/api/admin/funds", {
      method: isEdit ? "PATCH" : "POST",
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
    const successMessage = isEdit ? "Fund updated." : "Fund created.";
    setMessage(successMessage);
    toast.success(successMessage);
    router.refresh();
    if (!isEdit && json.data?.id) router.push(`/admin/funds/${json.data.id}`);
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-lg border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Title
          <input name="title" required defaultValue={fund?.title ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Fund Type
          <input value="Family fund" disabled className="w-full rounded-md border bg-muted px-3 py-2 text-muted-foreground" />
          <input type="hidden" name="type" value="FAMILY_GENERAL" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Status
          <select name="status" defaultValue={fund?.status ?? "ACTIVE"} className="w-full rounded-md border bg-background px-3 py-2">
            {["DRAFT", "ACTIVE", "CLOSED", "CANCELLED", "ARCHIVED"].map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Visibility
          <select name="visibility" defaultValue={fund?.visibility ?? "ALL_FAMILY"} className="w-full rounded-md border bg-background px-3 py-2">
            <option value="ALL_FAMILY">All family</option>
            <option value="INVITED_ONLY">Invited/participants only</option>
            <option value="ADMIN_ONLY">Admin only</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Target Amount
          <input name="targetAmount" type="number" min="0" step="0.01" defaultValue={fund?.targetAmount ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Currency
          <input name="currency" maxLength={3} defaultValue={fund?.currency ?? "PKR"} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Start
          <input name="startAt" type="datetime-local" defaultValue={toDatetimeLocal(fund?.startAt)} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          End
          <input name="endAt" type="datetime-local" defaultValue={toDatetimeLocal(fund?.endAt)} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium md:col-span-2">
          Related Event ID
          <input name="relatedEventId" defaultValue={fund?.relatedEventId ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
      </div>
      <label className="block space-y-1 text-sm font-medium">
        Description
        <textarea name="description" rows={4} defaultValue={fund?.description ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
      </label>
      <div className="flex flex-wrap gap-4 rounded-md border bg-muted/30 p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="isOfficial" type="checkbox" defaultChecked={fund?.isOfficial ?? true} />
          Official fund
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="isPinned" type="checkbox" defaultChecked={fund?.isPinned ?? false} />
          Pin fund
        </label>
      </div>
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        {isEdit ? "Save fund" : "Create fund"}
      </button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
