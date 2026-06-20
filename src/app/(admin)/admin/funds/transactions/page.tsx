import Link from "next/link";

import { TransactionReviewActions } from "@/components/admin/funds/fund-review-actions";
import { prisma } from "@/lib/db/prisma";
import { fundTransactionInclude } from "@/server/repositories/fund-transaction.repository";

export const dynamic = "force-dynamic";

export default async function FundTransactionsPage() {
  const transactions = await prisma.fundTransaction.findMany({
    where: { deletedAt: null },
    include: fundTransactionInclude,
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/funds" className="text-sm text-primary">Back to funds</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Fund Transactions</h1>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Fund</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Member</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((transaction) => (
              <tr key={transaction.id}>
                <td className="px-4 py-3"><Link href={`/admin/funds/${transaction.fundId}`} className="text-primary">{transaction.fund.title}</Link></td>
                <td className="px-4 py-3">{transaction.type}</td>
                <td className="px-4 py-3">{transaction.status}</td>
                <td className="px-4 py-3">{transaction.currency} {transaction.amount.toFixed(2)}</td>
                <td className="px-4 py-3">{transaction.contributor?.fullName ?? transaction.recipientMember?.fullName ?? "-"}</td>
                <td className="px-4 py-3"><TransactionReviewActions transactionId={transaction.id} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
