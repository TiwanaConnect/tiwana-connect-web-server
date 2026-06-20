import { RelationshipDebugger } from "@/components/admin/family-tree/relationship-debugger";
import { prisma } from "@/lib/db/prisma";

export default async function RelationshipFinderPage() {
  const members = await prisma.member.findMany({
    where: { deletedAt: null },
    orderBy: [{ fullName: "asc" }, { alias: "asc" }],
    select: { id: true, fullName: true, alias: true, initials: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Relationship Finder</h1>
        <p className="text-sm text-muted-foreground">
          Test relationship labels, path text, and path tree response.
        </p>
      </div>
      <RelationshipDebugger
        members={members.map((member) => ({
          id: member.id,
          label: member.fullName ?? member.alias ?? "Unnamed Member"
        }))}
      />
    </div>
  );
}
