import Link from "next/link";

import { getFamilyHeads, getStandaloneMembers } from "@/server/services/family-tree.service";

export default async function StandaloneMembersPage() {
  const [standalone, heads] = await Promise.all([
    getStandaloneMembers(),
    getFamilyHeads()
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Standalone Members</h1>
        <p className="text-sm text-muted-foreground">
          Members with no relationship records, plus current family heads.
        </p>
      </div>
      <section className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Standalone</h2>
        {standalone.length > 0 ? (
          <div className="mt-4 overflow-hidden rounded-md border">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Gender</th>
                  <th className="px-4 py-3">City</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Visibility</th>
                  <th className="px-4 py-3">Login</th>
                  <th className="px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {standalone.map((member) => (
                  <tr key={member.id}>
                    <td className="px-4 py-3 font-medium">{member.displayName}</td>
                    <td className="px-4 py-3">{member.gender}</td>
                    <td className="px-4 py-3">{member.city ?? "-"}</td>
                    <td className="px-4 py-3">{member.phone ?? "-"}</td>
                    <td className="px-4 py-3">{member.visibility}</td>
                    <td className="px-4 py-3">{member.userAccount ? "Has Account" : "No Login"}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Link href={`/admin/members/${member.id}`} className="text-primary">View</Link>
                        <Link href={`/admin/members/${member.id}/edit`} className="text-primary">Edit</Link>
                        <Link href={`/admin/members/${member.id}`} className="text-primary">Add relationship</Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-4 text-sm text-muted-foreground">No standalone members found.</p>
        )}
      </section>
      <section className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Family Heads</h2>
        <div className="mt-4 divide-y">
          {heads.map((member) => (
            <div key={member.id} className="flex items-center justify-between py-3 text-sm">
              <span>{member.displayName}</span>
              <Link href={`/admin/members/${member.id}`} className="text-primary">
                View
              </Link>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
