"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type EventFormProps = {
  mode: "create" | "edit";
  event?: {
    id: string;
    title: string;
    description: string | null;
    type: string;
    visibility: string;
    isOfficial: boolean;
    isPinned: boolean;
    startAt: string | Date;
    endAt: string | Date | null;
    timezone: string;
    locationName: string | null;
    locationAddress: string | null;
    mapUrl: string | null;
  };
  members: Array<{ id: string; label: string }>;
};

function toDatetimeLocal(value?: string | Date | null) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 16);
}

export function EventForm({ mode, event, members }: EventFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const isEdit = mode === "edit" && event;

  async function onSubmit(submitEvent: React.FormEvent<HTMLFormElement>) {
    submitEvent.preventDefault();
    setMessage(null);
    const data = new FormData(submitEvent.currentTarget);
    const invitedMemberIds = data
      .getAll("invitedMemberIds")
      .map(String)
      .filter(Boolean);
    const payload = {
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      type: String(data.get("type") ?? "FAMILY_EVENT"),
      visibility: String(data.get("visibility") ?? "INVITED_ONLY"),
      isOfficial: data.get("isOfficial") === "on",
      isPinned: data.get("isPinned") === "on",
      startAt: new Date(String(data.get("startAt"))).toISOString(),
      endAt: data.get("endAt") ? new Date(String(data.get("endAt"))).toISOString() : "",
      timezone: String(data.get("timezone") ?? "Asia/Karachi"),
      locationName: String(data.get("locationName") ?? ""),
      locationAddress: String(data.get("locationAddress") ?? ""),
      mapUrl: String(data.get("mapUrl") ?? ""),
      invitedMemberIds
      ,
      inviteAudience: String(data.get("inviteAudience") ?? "MANUAL")
    };
    const response = await fetch(isEdit ? `/api/admin/events/${event.id}` : "/api/admin/events", {
      method: isEdit ? "PATCH" : "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await response.json();

    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }

    setMessage(isEdit ? "Event updated." : "Event created.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6 rounded-lg border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Title
          <input name="title" required defaultValue={event?.title ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Type
          <select name="type" defaultValue={event?.type ?? "FAMILY_EVENT"} className="w-full rounded-md border bg-background px-3 py-2">
            {["FAMILY_EVENT", "OFFICIAL_MEETING", "WEDDING", "EID_GATHERING", "REUNION", "OTHER"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Start
          <input name="startAt" required type="datetime-local" defaultValue={toDatetimeLocal(event?.startAt)} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          End
          <input name="endAt" type="datetime-local" defaultValue={toDatetimeLocal(event?.endAt)} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Visibility
          <select name="visibility" defaultValue={event?.visibility ?? "INVITED_ONLY"} className="w-full rounded-md border bg-background px-3 py-2">
            <option value="ALL_FAMILY">All family</option>
            <option value="INVITED_ONLY">Invited only</option>
            <option value="BRANCH_ONLY">Branch only placeholder</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Timezone
          <input name="timezone" defaultValue={event?.timezone ?? "Asia/Karachi"} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Location name
          <input name="locationName" defaultValue={event?.locationName ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Map URL
          <input name="mapUrl" defaultValue={event?.mapUrl ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
      </div>
      <label className="block space-y-1 text-sm font-medium">
        Description
        <textarea name="description" rows={4} defaultValue={event?.description ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
      </label>
      <label className="block space-y-1 text-sm font-medium">
        Location address
        <textarea name="locationAddress" rows={2} defaultValue={event?.locationAddress ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
      </label>
      <div className="flex flex-wrap gap-4 rounded-md border bg-muted/30 p-4">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="isOfficial" type="checkbox" defaultChecked={event?.isOfficial ?? true} />
          Official event
        </label>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input name="isPinned" type="checkbox" defaultChecked={event?.isPinned ?? false} />
          Pin event
        </label>
      </div>
      {!isEdit ? (
        <div className="space-y-4 rounded-md border bg-muted/30 p-4">
          <label className="block space-y-1 text-sm font-medium">
            Invite Audience
            <select name="inviteAudience" defaultValue="MANUAL" className="w-full rounded-md border bg-background px-3 py-2">
              <option value="ALL_FAMILY">All family</option>
              <option value="ALL_MALES">All males</option>
              <option value="ALL_FEMALES">All females</option>
              <option value="MANUAL">Select members manually</option>
              <option value="BRANCH">Branch/family head placeholder</option>
            </select>
          </label>
          <label className="block space-y-1 text-sm font-medium">
            Invite members
            <select name="invitedMemberIds" multiple className="h-48 w-full rounded-md border bg-background px-3 py-2">
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.label}</option>
              ))}
            </select>
          </label>
        </div>
      ) : null}
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        {isEdit ? "Save event" : "Create event"}
      </button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
