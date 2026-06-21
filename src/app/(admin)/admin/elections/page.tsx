import Link from "next/link";

import { ElectionActionButton } from "@/components/admin/elections/election-actions";
import { LocalDateTimeRange } from "@/components/ui/local-date-time";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function ElectionsPage() {
  const elections = await prisma.election.findMany({
    where: { deletedAt: null },
    include: { candidates: { include: { member: true } } },
    orderBy: { createdAt: "desc" }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Elections</h1>
          <p className="text-sm text-muted-foreground">Confidential family elections, nominations, results, and ceremony.</p>
        </div>
        <Link href="/admin/elections/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">New Election</Link>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Position</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Voting</th><th className="px-4 py-3">Result</th><th className="px-4 py-3">Winner</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y">
            {elections.map((election) => {
              const winner = election.candidates.find((candidate) => candidate.id === election.winnerCandidateId);
              return (
                <tr key={election.id}>
                  <td className="px-4 py-3 font-medium">{election.title}</td>
                  <td className="px-4 py-3">{election.positionTitle}</td>
                  <td className="px-4 py-3">{election.status}</td>
                  <td className="px-4 py-3"><LocalDateTimeRange start={election.votingStartAt} end={election.votingEndAt} /></td>
                  <td className="px-4 py-3">{election.resultStatus}</td>
                  <td className="px-4 py-3">{winner?.member.fullName ?? winner?.member.alias ?? "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/elections/${election.id}`} className="text-primary">Open</Link>
                    {election.resultStatus === "FINALIZED" ? (
                      <ElectionActionButton href={`/api/admin/elections/${election.id}/publish-result`} label="Publish" />
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
