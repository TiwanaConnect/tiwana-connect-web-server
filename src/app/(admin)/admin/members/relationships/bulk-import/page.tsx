import { BulkImportPanel } from "@/components/admin/members/bulk-import-panel";

export default function BulkRelationshipImportPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Bulk Relationship Import</h1>
        <p className="text-sm text-muted-foreground">
          Supports member id, phone, or username identifiers.
        </p>
      </div>
      <BulkImportPanel type="relationships" />
    </div>
  );
}
