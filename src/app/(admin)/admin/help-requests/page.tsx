import Link from "next/link";

import { HelpRequestCancelButton } from "@/components/admin/directory/directory-actions";
import { prisma } from "@/lib/db/prisma";
import { helpRequestInclude } from "@/server/repositories/help-request.repository";

export const dynamic = "force-dynamic";

export default async function HelpRequestsPage() {
  const requests = await prisma.memberHelpRequest.findMany({
    where: { deletedAt: null },
    include: helpRequestInclude,
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/directory" className="text-sm text-primary">Back to directory</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Help Requests</h1>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">From</th><th className="px-4 py-3">To</th><th className="px-4 py-3">Category</th><th className="px-4 py-3">Priority</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Created</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-3 font-medium"><Link href={`/admin/help-requests/${request.id}`} className="text-primary">{request.title}</Link></td>
                <td className="px-4 py-3">{request.fromMember.fullName ?? request.fromMember.alias ?? "Unnamed Member"}</td>
                <td className="px-4 py-3">{request.toMember.fullName ?? request.toMember.alias ?? "Unnamed Member"}</td>
                <td className="px-4 py-3">{request.category ?? "-"}</td>
                <td className="px-4 py-3">{request.priority}</td>
                <td className="px-4 py-3">{request.status}</td>
                <td className="px-4 py-3">{request.createdAt.toLocaleString()}</td>
                <td className="px-4 py-3"><HelpRequestCancelButton requestId={request.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
