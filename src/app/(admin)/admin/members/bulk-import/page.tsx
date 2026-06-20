import Link from "next/link";

import { BulkImportPanel } from "@/components/admin/members/bulk-import-panel";

export default function BulkMemberImportPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Bulk Member Import</h1>
          <p className="text-sm text-muted-foreground">
            Paste CSV rows, preview validation, then import valid rows.
          </p>
        </div>
        <Link href="/admin/members/relationships/bulk-import" className="rounded-md border px-4 py-2 text-sm font-medium">
          Relationship Import
        </Link>
      </div>
      <BulkImportPanel type="members" />
    </div>
  );
}
