import Link from "next/link";

import { MemberListLoginActions } from "@/components/admin/members/member-list-login-actions";
import { prisma } from "@/lib/db/prisma";

export default async function MembersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "";
  const isFamilyHead =
    typeof params.isFamilyHead === "string" ? params.isFamilyHead : "";

  const members = await prisma.member.findMany({
    where: {
      deletedAt: null,
      ...(search
        ? {
            OR: [
              { fullName: { contains: search, mode: "insensitive" } },
              { alias: { contains: search, mode: "insensitive" } },
              { phone: { contains: search, mode: "insensitive" } },
              { city: { contains: search, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(status ? { status: status as never } : {}),
      ...(isFamilyHead === "true" ? { isFamilyHead: true } : {}),
      ...(isFamilyHead === "false" ? { isFamilyHead: false } : {})
    },
    include: { userAccount: true },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage family members and optional login access.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/members/bulk-import" className="rounded-md border px-4 py-2 text-sm font-medium">
            Bulk Import
          </Link>
          <Link href="/admin/members/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
            New Member
          </Link>
        </div>
      </div>
      <form className="flex flex-wrap gap-3 rounded-lg border bg-card p-4">
        <input name="search" defaultValue={search} placeholder="Search name, alias, phone, city" className="min-w-64 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        <select name="status" defaultValue={status} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
          <option value="PENDING">Pending</option>
        </select>
        <select name="isFamilyHead" defaultValue={isFamilyHead} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">All family heads</option>
          <option value="true">Family heads</option>
          <option value="false">Not family heads</option>
        </select>
        <button className="rounded-md border px-4 py-2 text-sm font-medium">Filter</button>
      </form>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name / alias</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3">Head</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Login Access</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium">
                  {member.fullName ?? member.alias ?? "Unnamed Member"}
                  {member.alias ? <span className="block text-xs text-muted-foreground">{member.alias}</span> : null}
                </td>
                <td className="px-4 py-3">{member.gender}</td>
                <td className="px-4 py-3">{member.visibility}</td>
                <td className="px-4 py-3">
                  {member.isFamilyHead ? (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      Head
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">{member.city ?? "-"}</td>
                <td className="px-4 py-3">{member.phone ?? "-"}</td>
                <td className="px-4 py-3">
                  {member.userAccount
                    ? member.userAccount.isActive
                      ? `Has Account (${member.userAccount.role})`
                      : "Inactive Login"
                    : "No Login"}
                </td>
                <td className="px-4 py-3">{member.status}</td>
                <td className="px-4 py-3">{member.createdAt.toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/members/${member.id}`} className="text-primary">View</Link>
                    <Link href={`/admin/members/${member.id}/edit`} className="text-primary">Edit</Link>
                    <MemberListLoginActions
                      memberId={member.id}
                      memberName={member.fullName ?? member.alias ?? "Unnamed Member"}
                      hasLogin={Boolean(member.userAccount)}
                      isLoginActive={Boolean(member.userAccount?.isActive)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
