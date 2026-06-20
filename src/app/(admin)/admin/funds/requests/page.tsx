import Link from "next/link";

import { RequestReviewActions } from "@/components/admin/funds/fund-review-actions";
import { prisma } from "@/lib/db/prisma";
import { fundRequestInclude } from "@/server/repositories/fund-request.repository";

export const dynamic = "force-dynamic";

export default async function FundRequestsPage() {
  const requests = await prisma.fundContributionRequest.findMany({
    include: fundRequestInclude,
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/funds" className="text-sm text-primary">Back to funds</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Contribution Requests</h1>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Fund</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Paid</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {requests.map((request) => (
              <tr key={request.id}>
                <td className="px-4 py-3"><Link href={`/admin/funds/${request.fundId}`} className="text-primary">{request.fund.title}</Link></td>
                <td className="px-4 py-3">{request.member.fullName ?? request.member.alias ?? "Unnamed Member"}</td>
                <td className="px-4 py-3">{request.status}</td>
                <td className="px-4 py-3">{request.currency} {request.paidAmount.toFixed(2)}</td>
                <td className="px-4 py-3">{request.requestedAmount?.toFixed(2) ?? "-"}</td>
                <td className="px-4 py-3"><RequestReviewActions requestId={request.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
