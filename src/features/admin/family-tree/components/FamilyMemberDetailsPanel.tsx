"use client";

import Link from "next/link";

import type { AdminFamilyTreeMember, FamilyChartPerson } from "../types";

export function FamilyMemberDetailsPanel({
  member,
  person,
  memberById,
  onClose,
  onFocusHere,
  onShowCloseFamily,
  onShowAllGenerations
}: {
  member: AdminFamilyTreeMember | null;
  person: FamilyChartPerson | null;
  memberById: Map<string, AdminFamilyTreeMember>;
  onClose: () => void;
  onFocusHere: () => void;
  onShowCloseFamily: () => void;
  onShowAllGenerations: () => void;
}) {
  if (!member) {
    return (
      <aside className="rounded-lg border bg-card p-5">
        <p className="text-sm font-medium">Member details</p>
        <p className="mt-2 text-sm text-muted-foreground">Select a card in the tree to inspect profile and relationship details.</p>
      </aside>
    );
  }

  const parents = person?.rels.parents.map((id) => memberById.get(id)).filter(Boolean) ?? [];
  const spouses = person?.rels.spouses.map((id) => memberById.get(id)).filter(Boolean) ?? [];
  const children = person?.rels.children.map((id) => memberById.get(id)).filter(Boolean) ?? [];

  return (
    <aside className="rounded-lg border bg-card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Selected member</p>
          <h2 className="mt-1 text-lg font-semibold">{member.fullName ?? member.alias ?? `Member ${member.id}`}</h2>
          <p className="text-sm text-muted-foreground">ID {member.id}</p>
        </div>
        <button type="button" onClick={onClose} className="rounded-md border px-2 py-1 text-xs">
          Close
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Badge label={member.gender} />
        <Badge label={member.status} tone={member.status === "ACTIVE" ? "good" : "warn"} />
        <Badge label={member.visibility} tone={member.visibility === "VISIBLE" ? "good" : "warn"} />
        {member.isFamilyHead ? <Badge label="Family head" tone="good" /> : null}
        {member.deletedAt ? <Badge label="Deleted" tone="danger" /> : null}
      </div>
      <dl className="mt-5 space-y-3 text-sm">
        <Info label="Alias" value={member.alias} />
        <Info label="City" value={member.city} />
        <Info label="Branch" value={member.branchLabel} />
        <Info label="Profession" value={member.profession} />
        <Info label="Phone" value={member.phone} />
      </dl>
      <div className="mt-5 space-y-4 border-t pt-4">
        <RelationList label="Parents" members={parents} />
        <RelationList label={member.gender === "MALE" ? "Wives" : "Husband"} members={spouses} />
        <RelationList label="Children" members={children} />
      </div>
      <div className="mt-5 grid gap-2">
        <button type="button" onClick={onFocusHere} className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground">
          Focus this member
        </button>
        <button type="button" onClick={onShowCloseFamily} className="rounded-md border px-3 py-2 text-sm">
          Show close family
        </button>
        <button type="button" onClick={onShowAllGenerations} className="rounded-md border px-3 py-2 text-sm">
          Show all generations
        </button>
        <div className="grid grid-cols-2 gap-2">
          <Link href={`/admin/members/${member.id}`} className="rounded-md border px-3 py-2 text-center text-sm">
            View profile
          </Link>
          <Link href={`/admin/members/${member.id}/edit`} className="rounded-md border px-3 py-2 text-center text-sm">
            Edit member
          </Link>
        </div>
      </div>
    </aside>
  );
}

function Info({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

function RelationList({ label, members }: { label: string; members: Array<AdminFamilyTreeMember | undefined> }) {
  const visibleMembers = members.filter(Boolean) as AdminFamilyTreeMember[];
  if (visibleMembers.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-2 space-y-1">
        {visibleMembers.map((member) => (
          <Link key={member.id} href={`/admin/members/${member.id}`} className="block rounded-md border px-3 py-2 text-sm hover:bg-muted">
            {member.fullName ?? member.alias ?? `Member ${member.id}`}
            <span className="block text-xs text-muted-foreground">ID {member.id}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Badge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "good" | "warn" | "danger" }) {
  const classes = {
    neutral: "bg-muted text-muted-foreground",
    good: "bg-emerald-100 text-emerald-700",
    warn: "bg-amber-100 text-amber-800",
    danger: "bg-red-100 text-red-700"
  };

  return <span className={`rounded-full px-2 py-1 text-xs font-medium ${classes[tone]}`}>{label}</span>;
}
