import Link from "next/link";

import { ElectionActionButton } from "@/components/admin/elections/election-actions";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function ElectionCeremonyPage({ params }: Props) {
  const { id } = await params;
  const election = await prisma.election.findUnique({ where: { id }, include: { candidates: { include: { member: true } } } });
  const winner = election?.candidates.find((candidate) => candidate.id === election.winnerCandidateId);
  const canSchedule = election?.status === "RESULT_ANNOUNCED" && !election.ceremonyAt;
  const canAssignPresident = election?.resultStatus === "PUBLISHED" && election.status !== "COMPLETED";
  const canComplete = election?.status === "PRESIDENT_AUTH_CEREMONY";

  return (
    <div className="space-y-6">
      <Link href={`/admin/elections/${id}`} className="text-sm text-primary">Back to election</Link>
      <div className="rounded-lg border bg-card p-8 text-center">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">New President Authorization Ceremony</p>
        <h1 className="mt-2 text-3xl font-semibold">{winner?.member.fullName ?? winner?.member.alias ?? "Winner pending"}</h1>
        <p className="mt-2 text-muted-foreground"><LocalDateTime value={election?.ceremonyAt} empty="Ceremony not scheduled" /></p>
        {election?.status === "COMPLETED" ? <p className="mt-3 text-sm font-medium">President authorization is completed.</p> : null}
      </div>
      <div className="flex flex-wrap gap-2">
        {canSchedule ? <ElectionActionButton href={`/api/admin/elections/${id}/schedule-ceremony`} label="Schedule now" body={{ ceremonyAt: new Date().toISOString() }} /> : null}
        {canAssignPresident ? <ElectionActionButton href={`/api/admin/elections/${id}/assign-president`} label="Assign president" /> : null}
        {canComplete ? <ElectionActionButton href={`/api/admin/elections/${id}/complete`} label="Complete election" /> : null}
        {!canSchedule && !canAssignPresident && !canComplete ? <p className="text-sm text-muted-foreground">No ceremony action is available for status {election?.status ?? "unknown"}.</p> : null}
      </div>
    </div>
  );
}
