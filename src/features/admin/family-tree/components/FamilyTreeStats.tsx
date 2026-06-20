import type { AdminFamilyTreeStats } from "../types";

export function FamilyTreeStats({ stats }: { stats: AdminFamilyTreeStats }) {
  const items = [
    { label: "Total members", value: stats.totalMembers },
    { label: "Active members", value: stats.activeMembers },
    { label: "Relationships", value: stats.relationshipCount },
    { label: "Family heads", value: stats.familyHeads },
    { label: "Standalone", value: stats.standaloneMembers }
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
      {items.map((item) => (
        <div key={item.label} className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
          <p className="mt-2 text-2xl font-semibold">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
