import Link from "next/link";

import { ElectionActionButton } from "@/components/admin/elections/election-actions";
import { prisma } from "@/lib/db/prisma";
import { verifyBallotChain } from "@/server/services/election-vote.service";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function ElectionVotingPage({ params }: Props) {
  const { id } = await params;
  const election = await prisma.election.findUnique({ where: { id }, include: { voters: true } });
  const chain = await verifyBallotChain(id);
  const eligible = election?.voters.filter((voter) => voter.status === "ELIGIBLE" || voter.status === "VOTED").length ?? 0;
  const voted = election?.voters.filter((voter) => voter.hasVoted).length ?? 0;
  const canOpen = election && ["CANDIDATES_ANNOUNCED", "VOTING_SCHEDULED"].includes(election.status);
  const canClose = election?.status === "VOTING_OPEN";

  return (
    <div className="space-y-6">
      <Link href={`/admin/elections/${id}`} className="text-sm text-primary">Back to election</Link>
      <div>
        <h1 className="text-2xl font-semibold">Voting</h1>
        <p className="text-sm text-muted-foreground">Voting closes by timeline. Admin can extend the voting phase from Timeline before election completion.</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Eligible</div><div className="text-xl font-semibold">{eligible}</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Votes cast</div><div className="text-xl font-semibold">{voted}</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Ballot chain</div><div className="text-xl font-semibold">{chain.valid ? "Valid" : "Invalid"}</div></div>
      </div>
      <div className="flex gap-2">
        {canOpen ? <ElectionActionButton href={`/api/admin/elections/${id}/open-voting`} label="Open voting" /> : null}
        {canClose ? <ElectionActionButton href={`/api/admin/elections/${id}/close-voting`} label="Close voting" /> : null}
        {!canOpen && !canClose ? <p className="text-sm text-muted-foreground">No voting action is available for status {election?.status ?? "unknown"}.</p> : null}
      </div>
      <p className="text-sm text-muted-foreground">Individual vote choices are not shown here and are not stored with voter records.</p>
    </div>
  );
}
