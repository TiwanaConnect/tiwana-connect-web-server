import Link from "next/link";

import { ExtendPhaseForm } from "@/components/admin/elections/election-actions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

function toDatetimeLocal(value: Date | null) {
  return value ? value.toISOString().slice(0, 16) : "";
}

export default async function ElectionTimelinePage({ params }: Props) {
  const { id } = await params;
  const election = await prisma.election.findUnique({
    where: { id },
    include: { phases: { orderBy: { createdAt: "asc" } } }
  });
  const isCompleted = election?.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <Link href={`/admin/elections/${id}`} className="text-sm text-primary">Back to election</Link>
      <div>
        <h1 className="text-2xl font-semibold">Timeline</h1>
        <p className="text-sm text-muted-foreground">
          Timeline dates are set during election creation. After that, admins can only extend or move dates until the election is completed.
        </p>
      </div>
      <div className="grid gap-3">
        {election?.phases.map((phase) => (
          <div key={phase.id} className="space-y-4 rounded-lg border bg-card p-4">
            <div className="flex flex-wrap justify-between gap-3">
              <div>
                <div className="font-semibold">{phase.title}</div>
                <p className="text-sm text-muted-foreground">
                  {phase.type} · extensions {phase.extensionCount} · {phase.isCompleted ? "completed" : "time-based"}
                </p>
                <p className="text-sm">{phase.startsAt?.toLocaleString() ?? "-"} to {phase.endsAt?.toLocaleString() ?? "-"}</p>
              </div>
            </div>
            {!isCompleted ? (
              <ExtendPhaseForm
                electionId={id}
                phaseType={phase.type}
                defaultStartsAt={toDatetimeLocal(phase.startsAt)}
                defaultEndsAt={toDatetimeLocal(phase.endsAt)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Election completed. Timeline is locked.</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
