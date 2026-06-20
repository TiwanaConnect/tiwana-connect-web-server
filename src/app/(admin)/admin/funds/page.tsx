import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { toAdminFundDto } from "@/server/dto/fund.dto";
import { fundInclude } from "@/server/repositories/fund.repository";

export const dynamic = "force-dynamic";

export default async function FundsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const funds = await prisma.familyFund.findMany({
    where: {
      deletedAt: null,
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      ...(status ? { status: status as never } : {})
    },
    include: fundInclude,
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }]
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Funds</h1>
          <p className="text-sm text-muted-foreground">Manage family funds, contribution requests, and ledger entries.</p>
        </div>
        <Link href="/admin/funds/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          New Fund
        </Link>
      </div>
      <div className="flex flex-wrap gap-2">
        <Link href="/admin/funds/transactions" className="rounded-md border px-3 py-2 text-sm font-medium">Transactions</Link>
        <Link href="/admin/funds/requests" className="rounded-md border px-3 py-2 text-sm font-medium">Requests</Link>
      </div>
      <form className="flex flex-wrap gap-3 rounded-lg border bg-card p-4">
        <input name="q" defaultValue={q} placeholder="Search funds" className="min-w-64 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        <select name="status" defaultValue={status} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
          {["DRAFT", "ACTIVE", "CLOSED", "CANCELLED", "ARCHIVED"].map((item) => <option key={item} value={item}>{item}</option>)}
        </select>
        <button className="rounded-md border px-4 py-2 text-sm font-medium">Filter</button>
      </form>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Fund</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">Collected</th>
              <th className="px-4 py-3">Spent</th>
              <th className="px-4 py-3">Requests</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {funds.map((rawFund) => {
              const fund = toAdminFundDto(rawFund);
              return (
                <tr key={fund.id}>
                  <td className="px-4 py-3">
                    <div className="font-medium">{fund.title}</div>
                    <div className="text-xs text-muted-foreground">{fund.visibility}{fund.isPinned ? " · pinned" : ""}</div>
                  </td>
                  <td className="px-4 py-3">{fund.type}</td>
                  <td className="px-4 py-3">{fund.status}</td>
                  <td className="px-4 py-3">{fund.currency} {fund.balanceAmount}</td>
                  <td className="px-4 py-3">{fund.collectedAmount}</td>
                  <td className="px-4 py-3">{fund.spentAmount}</td>
                  <td className="px-4 py-3">{fund.requestCount}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/funds/${fund.id}`} className="text-primary">View</Link>
                      <Link href={`/admin/funds/${fund.id}/edit`} className="text-primary">Edit</Link>
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
