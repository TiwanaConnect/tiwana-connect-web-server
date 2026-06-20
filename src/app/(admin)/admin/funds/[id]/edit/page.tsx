import Link from "next/link";
import { notFound } from "next/navigation";

import { FundForm } from "@/components/admin/funds/fund-form";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function EditFundPage({ params }: Props) {
  const { id } = await params;
  const fund = await prisma.familyFund.findUnique({ where: { id } });
  if (!fund || fund.deletedAt) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href={`/admin/funds/${fund.id}`} className="text-sm text-primary">Back to fund</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit Fund</h1>
      </div>
      <FundForm
        mode="edit"
        fund={{
          id: fund.id,
          title: fund.title,
          description: fund.description,
          type: fund.type,
          status: fund.status,
          visibility: fund.visibility,
          targetAmount: fund.targetAmount?.toFixed(2) ?? null,
          currency: fund.currency,
          isOfficial: fund.isOfficial,
          isPinned: fund.isPinned,
          startAt: fund.startAt,
          endAt: fund.endAt,
          relatedEventId: fund.relatedEventId
        }}
      />
    </div>
  );
}
