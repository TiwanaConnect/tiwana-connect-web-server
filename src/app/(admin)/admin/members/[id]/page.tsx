import Link from "next/link";
import { notFound } from "next/navigation";

import { MemberActions } from "@/components/admin/members/member-actions";
import { RelationshipPanel } from "@/components/admin/members/relationship-panel";
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
            Add direct relationships. Full tree traversal comes in Phase 2.
          </p>
        </div>
        <RelationshipPanel memberId={member.id} />
        <div className="grid gap-3">
          {[...member.relationshipsFrom, ...member.relationshipsTo].map((relationship) => {
            const target =
              "toMember" in relationship
                ? relationship.toMember
                : relationship.fromMember;

            return (
              <div key={relationship.id} className="rounded-md border p-3 text-sm">
                {relationship.type}: {target.fullName ?? target.alias ?? target.initials}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
