import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { toAdminDirectoryMemberDto } from "@/server/dto/directory.dto";
import { directoryMemberInclude } from "@/server/repositories/directory.repository";

export const dynamic = "force-dynamic";

export default async function DirectoryPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const members = await prisma.member.findMany({
    where: {
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { fullName: { contains: q, mode: "insensitive" } },
              { alias: { contains: q, mode: "insensitive" } },
              { city: { contains: q, mode: "insensitive" } },
              { profession: { contains: q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: directoryMemberInclude,
    orderBy: [{ fullName: "asc" }, { alias: "asc" }],
    take: 100
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Directory</h1>
          <p className="text-sm text-muted-foreground">Search members, visibility settings, tags, and help availability.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tags" className="rounded-md border px-3 py-2 text-sm font-medium">Tags</Link>
          <Link href="/admin/help-requests" className="rounded-md border px-3 py-2 text-sm font-medium">Help Requests</Link>
        </div>
      </div>
      <form className="flex gap-3 rounded-lg border bg-card p-4">
        <input name="q" defaultValue={q} placeholder="Search name, city, profession" className="min-w-64 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        <button className="rounded-md border px-4 py-2 text-sm font-medium">Search</button>
      </form>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Profession</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Branch</th>
              <th className="px-4 py-3">Directory</th>
              <th className="px-4 py-3">Tags</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {members.map((rawMember) => {
              const member = toAdminDirectoryMemberDto(rawMember);
              return (
                <tr key={member.id}>
                  <td className="px-4 py-3 font-medium">{member.displayName}</td>
                  <td className="px-4 py-3">{member.gender}</td>
                  <td className="px-4 py-3">{member.city ?? "-"}</td>
                  <td className="px-4 py-3">{member.profession ?? "-"}</td>
                  <td className="px-4 py-3">{member.phone ?? "-"}</td>
                  <td className="px-4 py-3">{member.branchLabel ?? "-"}</td>
                  <td className="px-4 py-3">{member.directoryVisibility}{member.allowHelpRequests ? " · help" : ""}</td>
                  <td className="px-4 py-3">{member.tags.map((tag) => tag.name).join(", ") || "-"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/directory/${member.id}`} className="text-primary">View</Link>
                      <Link href={`/admin/members/${member.id}/edit`} className="text-primary">Edit</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
