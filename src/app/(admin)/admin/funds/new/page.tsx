import Link from "next/link";

import { FundForm } from "@/components/admin/funds/fund-form";

export default function NewFundPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/funds" className="text-sm text-primary">Back to funds</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">New Fund</h1>
      </div>
      <FundForm mode="create" />
    </div>
  );
}
