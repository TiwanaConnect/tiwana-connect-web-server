import Link from "next/link";
import { notFound } from "next/navigation";

import { ContributionRequestForm } from "@/components/admin/funds/contribution-request-form";
import { FundActions } from "@/components/admin/funds/fund-actions";
import { FundTransactionForm } from "@/components/admin/funds/fund-transaction-form";
import { prisma } from "@/lib/db/prisma";
import { toAdminFundDto } from "@/server/dto/fund.dto";
import { fundInclude } from "@/server/repositories/fund.repository";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function FundDetailPage({ params }: Props) {
  const { id } = await params;
  const rawFund = await prisma.familyFund.findUnique({ where: { id }, include: fundInclude });
  if (!rawFund || rawFund.deletedAt) notFound();
  const fund = toAdminFundDto(rawFund);
  const members = await prisma.member.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    orderBy: [{ fullName: "asc" }, { alias: "asc" }],
    select: { id: true, fullName: true, alias: true, initials: true }
  });
  const memberOptions = members.map((member) => ({
    id: member.id,
    label: member.fullName ?? member.alias ?? member.initials
  }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link href="/admin/funds" className="text-sm text-primary">Back to funds</Link>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">{fund.title}</h1>
          <p className="text-sm text-muted-foreground">{fund.type} · {fund.status} · {fund.visibility}</p>
        </div>
        <Link href={`/admin/funds/${fund.id}/edit`} className="rounded-md border px-4 py-2 text-sm font-medium">Edit</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Balance", `${fund.currency} ${fund.balanceAmount}`],
          ["Collected", `${fund.currency} ${fund.collectedAmount}`],
          ["Spent", `${fund.currency} ${fund.spentAmount}`],
          ["Target", fund.targetAmount ? `${fund.currency} ${fund.targetAmount}` : "-"]
        ].map(([label, value]) => (
          <div key={label} className="rounded-lg border bg-card p-4">
            <div className="text-xs uppercase text-muted-foreground">{label}</div>
            <div className="mt-1 text-xl font-semibold">{value}</div>
          </div>
        ))}
      </div>
      <FundActions fundId={fund.id} />
      <div className="grid gap-6 xl:grid-cols-2">
        <FundTransactionForm fundId={fund.id} members={memberOptions} />
        <ContributionRequestForm fundId={fund.id} members={memberOptions} />
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3 font-semibold">Transactions</div>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y">
              {rawFund.transactions.slice(0, 12).map((transaction) => (
                <tr key={transaction.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{transaction.type}</div>
                    <div className="text-xs text-muted-foreground">{transaction.status} · {transaction.createdAt.toLocaleString()}</div>
                  </td>
                  <td className="px-4 py-3">{transaction.currency} {transaction.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="overflow-hidden rounded-lg border bg-card">
          <div className="border-b px-4 py-3 font-semibold">Contribution Requests</div>
          <table className="w-full text-left text-sm">
            <tbody className="divide-y">
              {rawFund.requests.slice(0, 12).map((request) => (
                <tr key={request.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{request.member.fullName ?? request.member.alias ?? "Unnamed Member"}</div>
                    <div className="text-xs text-muted-foreground">{request.status}</div>
                  </td>
                  <td className="px-4 py-3">{request.currency} {request.paidAmount.toFixed(2)} / {request.requestedAmount?.toFixed(2) ?? "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
