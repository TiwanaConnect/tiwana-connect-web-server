import Link from "next/link";

import { ElectionActionButton } from "@/components/admin/elections/election-actions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function ElectionCandidatesPage({ params }: Props) {
  const { id } = await params;
  const election = await prisma.election.findUnique({
    where: { id },
    include: { candidates: { include: { member: true }, orderBy: { displayOrder: "asc" } } }
  });
  const canAnnounce = election && !["CANDIDATES_ANNOUNCED", "VOTING_SCHEDULED", "VOTING_OPEN", "VOTING_CLOSED", "TALLYING", "RESULT_ANNOUNCED", "PRESIDENT_AUTH_CEREMONY", "COMPLETED", "CANCELLED"].includes(election.status);

  return (
    <div className="space-y-6">
      <Link href={`/admin/elections/${id}`} className="text-sm text-primary">Back to election</Link>
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Candidates</h1>
          <p className="text-sm text-muted-foreground">Approved nominations become candidates. Announce once, then manage voting and result pages.</p>
        </div>
        {canAnnounce ? <ElectionActionButton href={`/api/admin/elections/${id}/announce-candidates`} label="Announce candidates" /> : null}
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {election?.candidates.map((candidate) => (
          <div key={candidate.id} className="rounded-lg border bg-card p-4">
            <h2 className="font-semibold">{candidate.member.fullName ?? candidate.member.alias ?? "Unnamed Member"}</h2>
            <p className="text-sm text-muted-foreground">{candidate.member.city ?? "-"} · {candidate.member.profession ?? "-"}</p>
            <p className="mt-3 text-sm">{candidate.statement}</p>
            {candidate.slogan ? <p className="mt-2 text-sm font-medium">Slogan: {candidate.slogan}</p> : null}
            <p className="mt-3 text-xs text-muted-foreground">{candidate.status}{candidate.announcedAt ? ` · announced ${candidate.announcedAt.toLocaleString()}` : ""}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
