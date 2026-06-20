import Link from "next/link";

import { AdminFamilyTreeClient } from "@/features/admin/family-tree/components/AdminFamilyTreeClient";

export default async function AdminFamilyTreePage() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Family Tree</h1>
          <p className="text-sm text-muted-foreground">
            Explore the full family hierarchy, focus members, inspect relationships, and print the current tree view.
          </p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/family-tree/standalone" className="rounded-md border px-4 py-2 text-sm font-medium">
            Standalone
          </Link>
          <Link href="/admin/family-tree/relationship" className="rounded-md border px-4 py-2 text-sm font-medium">
            Relationship
          </Link>
        </div>
      </div>
      <AdminFamilyTreeClient />
    </div>
  );
}
