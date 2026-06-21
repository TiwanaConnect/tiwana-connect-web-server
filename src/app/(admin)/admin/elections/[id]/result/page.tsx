import Link from "next/link";

import { ElectionActionButton } from "@/components/admin/elections/election-actions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function ElectionResultPage({ params }: Props) {
  const { id } = await params;
  const election = await prisma.election.findUnique({ where: { id }, include: { result: true } });
  const result = election?.result ?? null;
  const rows = Array.isArray(result?.resultsJson) ? result.resultsJson as Array<{ candidateId: string; voteCount: number; percentage: number }> : [];
  const resultActionsLocked = !election || ["RESULT_ANNOUNCED", "COMPLETED", "CANCELLED"].includes(election.status);
  const canTally = election && !resultActionsLocked && election.status === "VOTING_CLOSED" && result?.status !== "FINALIZED" && result?.status !== "PUBLISHED";
  const canPublish = !resultActionsLocked && result?.status === "FINALIZED";

  return (
    <div className="space-y-6">
      <Link href={`/admin/elections/${id}`} className="text-sm text-primary">Back to election</Link>
      <div>
        <h1 className="text-2xl font-semibold">Result</h1>
        <p className="text-sm text-muted-foreground">Results are calculated from encrypted ballots. Vote counts are not manually editable.</p>
      </div>
      <div className="flex gap-2">
        {canTally ? <ElectionActionButton href={`/api/admin/elections/${id}/start-tally`} label="Start tally" /> : null}
        {canPublish ? <ElectionActionButton href={`/api/admin/elections/${id}/publish-result`} label="Publish result" /> : null}
        {!canTally && !canPublish ? <p className="text-sm text-muted-foreground">No result action is available for status {election?.status ?? result?.status ?? "not ready"}.</p> : null}
      </div>
      <div className="rounded-lg border bg-card p-4"><div className="font-semibold">Result hash</div><p className="break-all text-sm text-muted-foreground">{result?.resultHash ?? "Not finalized"}</p></div>
      <div className="grid gap-3">{rows.map((row) => <div key={row.candidateId} className="rounded-lg border bg-card p-4"><div className="font-medium">{row.candidateId}</div><p className="text-sm text-muted-foreground">{row.voteCount} votes · {row.percentage}%</p></div>)}</div>
    </div>
  );
}
