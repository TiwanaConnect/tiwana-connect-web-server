"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DirectorySettingsForm({
  memberId,
  setting
}: {
  memberId: string;
  setting: {
    directoryVisibility: string;
    showPhone: boolean;
    showCity: boolean;
    showProfession: boolean;
    allowHelpRequests: boolean;
    bio: string | null;
    availabilityNote: string | null;
  };
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const payload = {
      visibility: String(data.get("visibility") ?? "VISIBLE"),
      showPhone: data.get("showPhone") === "on",
      showCity: data.get("showCity") === "on",
      showProfession: data.get("showProfession") === "on",
      allowHelpRequests: data.get("allowHelpRequests") === "on",
      bio: String(data.get("bio") ?? ""),
      availabilityNote: String(data.get("availabilityNote") ?? "")
    };
    const response = await fetch(`/api/admin/directory/${memberId}/settings`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }
    setMessage("Settings saved.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">Directory Settings</h2>
      <select name="visibility" defaultValue={setting.directoryVisibility} className="w-full rounded-md border bg-background px-3 py-2 text-sm">
        <option value="VISIBLE">Visible</option>
        <option value="LIMITED">Limited</option>
        <option value="HIDDEN">Hidden</option>
      </select>
      <div className="flex flex-wrap gap-4 text-sm font-medium">
        <label><input name="showPhone" type="checkbox" defaultChecked={setting.showPhone} /> Show phone</label>
        <label><input name="showCity" type="checkbox" defaultChecked={setting.showCity} /> Show city</label>
        <label><input name="showProfession" type="checkbox" defaultChecked={setting.showProfession} /> Show profession</label>
        <label><input name="allowHelpRequests" type="checkbox" defaultChecked={setting.allowHelpRequests} /> Allow help requests</label>
      </div>
      <textarea name="bio" rows={3} defaultValue={setting.bio ?? ""} placeholder="Bio" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      <textarea name="availabilityNote" rows={2} defaultValue={setting.availabilityNote ?? ""} placeholder="Availability note" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Save settings</button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

export function TagAssignmentForm({
  memberId,
  tags
}: {
  memberId: string;
  tags: Array<{ id: string; name: string; type: string }>;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch(`/api/admin/members/${memberId}/tags`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ tagIds: data.getAll("tagIds").map(String).filter(Boolean) })
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }
    setMessage("Tags assigned.");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">Assign Tags</h2>
      <select name="tagIds" multiple className="h-44 w-full rounded-md border bg-background px-3 py-2 text-sm">
        {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name} ({tag.type})</option>)}
      </select>
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Assign tags</button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}

export function TagForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: String(data.get("name") ?? ""),
        slug: String(data.get("slug") ?? ""),
        type: String(data.get("type") ?? "OTHER"),
        description: String(data.get("description") ?? ""),
        color: String(data.get("color") ?? "")
      })
    });
    const json = await response.json();
    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }
    setMessage("Tag created.");
    event.currentTarget.reset();
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-3 rounded-lg border bg-card p-4 md:grid-cols-5">
      <input name="name" required placeholder="Name" className="rounded-md border bg-background px-3 py-2 text-sm" />
      <input name="slug" placeholder="slug optional" className="rounded-md border bg-background px-3 py-2 text-sm" />
      <select name="type" className="rounded-md border bg-background px-3 py-2 text-sm">
        {["SKILL", "PROFESSION", "CITY", "FAMILY_BRANCH", "INTEREST", "SERVICE", "OTHER"].map((type) => <option key={type} value={type}>{type}</option>)}
      </select>
      <input name="color" placeholder="#2563eb" className="rounded-md border bg-background px-3 py-2 text-sm" />
      <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Create</button>
      <input name="description" placeholder="Description" className="rounded-md border bg-background px-3 py-2 text-sm md:col-span-5" />
      {message ? <p className="text-sm text-muted-foreground md:col-span-5">{message}</p> : null}
    </form>
  );
}

export function DisableTagButton({ tagId, active }: { tagId: string; active: boolean }) {
  const router = useRouter();
  async function onClick() {
    if (active) {
      await fetch(`/api/admin/tags/${tagId}`, { method: "DELETE" });
    } else {
      await fetch(`/api/admin/tags/${tagId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ isActive: true })
      });
    }
    router.refresh();
  }
  return <button onClick={onClick} className="text-primary">{active ? "Disable" : "Enable"}</button>;
}

export function HelpRequestCancelButton({ requestId }: { requestId: string }) {
  const router = useRouter();
  async function onClick() {
    await fetch(`/api/admin/help-requests/${requestId}/cancel`, { method: "POST" });
    router.refresh();
  }
  return <button onClick={onClick} className="rounded-md border px-3 py-1 text-xs font-medium">Cancel</button>;
}
