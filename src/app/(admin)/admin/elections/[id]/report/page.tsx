import Link from "next/link";
import { notFound } from "next/navigation";

import { PrintReportButton } from "@/components/admin/elections/print-report-button";
import { LocalDateTime } from "@/components/ui/local-date-time";
import { prisma } from "@/lib/db/prisma";
import { verifyBallotChain } from "@/server/services/election-vote.service";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

type ResultRow = {
  candidateId: string;
  memberId: string;
  voteCount: number;
  percentage: number;
};

export default async function ElectionReportPage({ params }: Props) {
  const { id } = await params;
  const election = await prisma.election.findUnique({
    where: { id },
    include: {
      nominations: { include: { member: true }, orderBy: { submittedAt: "asc" } },
      candidates: { include: { member: true }, orderBy: { displayOrder: "asc" } },
      voters: true,
      result: true
    }
  });
  if (!election || election.deletedAt) notFound();

  const chain = await verifyBallotChain(id);
  const rows = Array.isArray(election.result?.resultsJson) ? election.result.resultsJson as ResultRow[] : [];
  const rowByCandidate = new Map(rows.map((row) => [row.candidateId, row]));
  const eligible = election.voters.filter((voter) => voter.status === "ELIGIBLE" || voter.status === "VOTED").length;
  const voted = election.voters.filter((voter) => voter.hasVoted).length;
  const winner = election.candidates.find((candidate) => candidate.id === election.winnerCandidateId);

  return (
    <div className="space-y-8 print:bg-white print:text-black">
      <div className="flex flex-wrap items-start justify-between gap-4 print:hidden">
        <Link href={`/admin/elections/${id}`} className="text-sm text-primary">Back to election</Link>
        <PrintReportButton />
      </div>

      <header className="border-b pb-6">
        <p className="text-sm uppercase tracking-wide text-muted-foreground">Election Report</p>
        <h1 className="mt-2 text-3xl font-semibold">{election.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{election.positionTitle} · {election.status} · {election.resultStatus}</p>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border p-4"><div className="text-xs uppercase text-muted-foreground">Eligible voters</div><div className="mt-1 text-xl font-semibold">{eligible}</div></div>
        <div className="rounded-lg border p-4"><div className="text-xs uppercase text-muted-foreground">Votes cast</div><div className="mt-1 text-xl font-semibold">{voted}</div></div>
        <div className="rounded-lg border p-4"><div className="text-xs uppercase text-muted-foreground">Turnout</div><div className="mt-1 text-xl font-semibold">{eligible ? Math.round((voted / eligible) * 10000) / 100 : 0}%</div></div>
        <div className="rounded-lg border p-4"><div className="text-xs uppercase text-muted-foreground">Ballot chain</div><div className="mt-1 text-xl font-semibold">{chain.valid ? "Valid" : "Invalid"}</div></div>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Nominations</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="py-2">Member</th><th className="py-2">Status</th><th className="py-2">Slogan</th><th className="py-2">Submitted</th></tr></thead>
          <tbody className="divide-y">
            {election.nominations.map((nomination) => (
              <tr key={nomination.id}>
                <td className="py-2">{nomination.member.fullName ?? nomination.member.alias ?? "Unnamed Member"}</td>
                <td className="py-2">{nomination.status}</td>
                <td className="py-2">{nomination.slogan ?? "-"}</td>
                <td className="py-2"><LocalDateTime value={nomination.submittedAt} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Candidates And Votes</h2>
        <table className="w-full text-left text-sm">
          <thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="py-2">Candidate</th><th className="py-2">Status</th><th className="py-2">Votes</th><th className="py-2">Percentage</th></tr></thead>
          <tbody className="divide-y">
            {election.candidates.map((candidate) => {
              const result = rowByCandidate.get(candidate.id);
              return (
                <tr key={candidate.id}>
                  <td className="py-2">{candidate.member.fullName ?? candidate.member.alias ?? "Unnamed Member"}</td>
                  <td className="py-2">{candidate.status}</td>
                  <td className="py-2">{result?.voteCount ?? 0}</td>
                  <td className="py-2">{result?.percentage ?? 0}%</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="rounded-lg border p-5">
        <h2 className="text-xl font-semibold">Winner</h2>
        <p className="mt-2 text-lg">{winner?.member.fullName ?? winner?.member.alias ?? "Winner not finalized"}</p>
        <p className="mt-2 break-all text-sm text-muted-foreground">Result hash: {election.result?.resultHash ?? "Not finalized"}</p>
      </section>
    </div>
  );
}
