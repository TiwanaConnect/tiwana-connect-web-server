import Link from "next/link";
import { notFound } from "next/navigation";
import { ElectionActionButton } from "@/components/admin/elections/election-actions";
import { prisma } from "@/lib/db/prisma";
import { verifyBallotChain } from "@/server/services/election-vote.service";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function ElectionDashboardPage({ params }: Props) {
  const { id } = await params;
  const election = await prisma.election.findUnique({ where: { id }, include: { voters: true, nominations: true, candidates: { include: { member: true } }, result: true } });
  if (!election || election.deletedAt) notFound();
  const chain = await verifyBallotChain(id);
  const eligible = election.voters.filter((voter) => voter.status === "ELIGIBLE" || voter.status === "VOTED").length;
  const voted = election.voters.filter((voter) => voter.hasVoted).length;
  const canCancel = !["COMPLETED", "CANCELLED"].includes(election.status);
  const canAnnounce = election.status === "DRAFT" || !election.isPublished;
  return (
    <div className="space-y-6">
      <div><Link href="/admin/elections" className="text-sm text-primary">Back to elections</Link><h1 className="mt-2 text-2xl font-semibold tracking-tight">{election.title}</h1><p className="text-sm text-muted-foreground">{election.positionTitle} · {election.status} · {election.resultStatus}</p></div>
      <div className="grid gap-4 md:grid-cols-4">
        {[["Eligible", eligible], ["Votes", voted], ["Nominations", election.nominations.length], ["Candidates", election.candidates.length]].map(([label, value]) => <div key={label} className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">{label}</div><div className="mt-1 text-xl font-semibold">{value}</div></div>)}
      </div>
      <div className="rounded-lg border bg-card p-4"><div className="font-semibold">Ballot Chain</div><p className="text-sm text-muted-foreground">{chain.valid ? "Valid" : `Broken at index ${chain.brokenAtIndex}`}</p></div>
      <div className="flex flex-wrap gap-2">
        {["timeline", "nominations", "candidates", "voting", "result", "ceremony", "report"].map((item) => <Link key={item} href={`/admin/elections/${id}/${item}`} className="rounded-md border px-3 py-2 text-sm font-medium capitalize">{item}</Link>)}
        {canAnnounce ? <ElectionActionButton href={`/api/admin/elections/${id}/announce`} label="Announce election" /> : null}
        {canCancel ? <ElectionActionButton href={`/api/admin/elections/${id}/cancel`} label="Cancel election" /> : null}
      </div>
    </div>
  );
}
