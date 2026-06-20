import Link from "next/link";

import { FamilyTreeDebugger } from "@/components/admin/family-tree/family-tree-debugger";
import { prisma } from "@/lib/db/prisma";

export default async function AdminFamilyTreePage() {
  const members = await prisma.member.findMany({
    where: { deletedAt: null },
    orderBy: [{ fullName: "asc" }, { alias: "asc" }],
    select: { id: true, fullName: true, alias: true, initials: true }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Family Tree</h1>
          <p className="text-sm text-muted-foreground">
            Debug the Phase 2 family tree response shape.
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
      <FamilyTreeDebugger
        members={members.map((member) => ({
          id: member.id,
          label: member.fullName ?? member.alias ?? "Unnamed Member"
        }))}
      />
    </div>
  );
}
