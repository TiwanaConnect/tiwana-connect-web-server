import Link from "next/link";
import { notFound } from "next/navigation";

import { MemberActions } from "@/components/admin/members/member-actions";
import { prisma } from "@/lib/db/prisma";

export default async function MemberDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      userAccount: true,
      relationshipsFrom: { include: { toMember: true } },
      relationshipsTo: { include: { fromMember: true } }
    }
  });

  if (!member || member.deletedAt) {
    notFound();
  }
  const father = member.relationshipsTo.find((relationship) => relationship.type === "FATHER")?.fromMember
    ?? member.relationshipsFrom.find((relationship) => relationship.type === "CHILD" && relationship.toMember.gender === "MALE")?.toMember
    ?? null;
  const mother = member.relationshipsTo.find((relationship) => relationship.type === "MOTHER")?.fromMember
    ?? member.relationshipsFrom.find((relationship) => relationship.type === "CHILD" && relationship.toMember.gender === "FEMALE")?.toMember
    ?? null;
  const childMap = new Map<string, { fullName: string | null; alias: string | null; initials: string }>();
  for (const relationship of member.relationshipsFrom) {
    if (relationship.type === "FATHER" || relationship.type === "MOTHER") {
      childMap.set(relationship.toMemberId, relationship.toMember);
    }
  }
  for (const relationship of member.relationshipsTo) {
    if (relationship.type === "CHILD") {
      childMap.set(relationship.fromMemberId, relationship.fromMember);
    }
  }
  const spouseMap = new Map<string, { fullName: string | null; alias: string | null; initials: string }>();
  for (const relationship of member.relationshipsFrom) {
    if (relationship.type === "SPOUSE") spouseMap.set(relationship.toMemberId, relationship.toMember);
  }
  for (const relationship of member.relationshipsTo) {
    if (relationship.type === "SPOUSE") spouseMap.set(relationship.fromMemberId, relationship.fromMember);
  }
  const children = [...childMap.values()];
  const spouses = [...spouseMap.values()];
  const relationshipRows = [
    father ? { label: "Father", values: [father] } : null,
    mother ? { label: "Mother", values: [mother] } : null,
    children.length > 0 ? { label: children.length === 1 ? "Child" : "Children", values: children } : null,
    spouses.length > 0 ? { label: member.gender === "MALE" ? (spouses.length === 1 ? "Wife" : "Wives") : "Husband", values: spouses } : null
  ].filter((row): row is { label: string; values: Array<{ fullName: string | null; alias: string | null; initials: string }> } => Boolean(row));
  const displayName = (item: { fullName: string | null; alias: string | null; initials: string }) =>
    item.fullName ?? item.alias ?? item.initials;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {member.fullName ?? member.alias ?? member.initials}
          </h1>
          <p className="text-sm text-muted-foreground">{member.id}</p>
        </div>
        <Link href={`/admin/members/${member.id}/edit`} className="rounded-md border px-4 py-2 text-sm font-medium">
          Edit
        </Link>
      </div>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold">Profile</h2>
          <dl className="mt-4 grid gap-2 text-sm">
            <div>Alias: {member.alias ?? "-"}</div>
            <div>Gender: {member.gender}</div>
            <div>Visibility: {member.visibility}</div>
            <div>Head of family: {member.isFamilyHead ? "Yes" : "No"}</div>
            <div>Status: {member.status}</div>
            <div>City: {member.city ?? "-"}</div>
            <div>Phone: {member.phone ?? "-"}</div>
            <div>Profession: {member.profession ?? "-"}</div>
            <div>Branch: {member.branchLabel ?? "-"}</div>
          </dl>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold">Login Access</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            {member.userAccount
              ? `${member.userAccount.username} (${member.userAccount.role})`
              : "No login account"}
          </p>
          <div className="mt-4">
            <MemberActions
              memberId={member.id}
              hasLogin={Boolean(member.userAccount)}
              isLoginActive={Boolean(member.userAccount?.isActive)}
              status={member.status}
            />
          </div>
        </div>
      </section>
      <section className="space-y-4 rounded-lg border bg-card p-6">
        <div>
          <h2 className="font-semibold">Family Relationships</h2>
          <p className="text-sm text-muted-foreground">
            Direct family relationships for this member.
          </p>
        </div>
        {relationshipRows.length > 0 ? (
          <dl className="grid gap-3">
            {relationshipRows.map((row) => (
              <div key={row.label} className="rounded-md border p-3 text-sm">
                <dt className="font-medium">{row.label}:</dt>
                <dd className="mt-1 text-muted-foreground">
                  {row.values.map(displayName).join(", ")}
                </dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="text-sm text-muted-foreground">No direct relationships found.</p>
        )}
      </section>
    </div>
  );
}
