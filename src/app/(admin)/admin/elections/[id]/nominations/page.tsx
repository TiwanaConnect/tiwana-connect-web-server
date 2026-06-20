import Link from "next/link";

import { ElectionActionButton } from "@/components/admin/elections/election-actions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function ElectionNominationsPage({ params }: Props) {
  const { id } = await params;
  const election = await prisma.election.findUnique({ where: { id } });
  const nominations = await prisma.electionNomination.findMany({
    where: { electionId: id },
    include: { member: true },
    orderBy: { submittedAt: "desc" }
  });
  const nominationActionsLocked =
    !election ||
    new Date() >= election.votingStartAt ||
    [
      "VOTING_OPEN",
      "VOTING_CLOSED",
      "TALLYING",
      "RESULT_ANNOUNCED",
      "PRESIDENT_AUTH_CEREMONY",
      "COMPLETED",
      "CANCELLED"
    ].includes(election.status);

  return (
    <div className="space-y-6">
      <Link href={`/admin/elections/${id}`} className="text-sm text-primary">Back to election</Link>
      <h1 className="text-2xl font-semibold">Nominations</h1>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Statement</th><th className="px-4 py-3">Slogan</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Actions</th></tr>
          </thead>
          <tbody className="divide-y">
            {nominations.map((nomination) => (
              <tr key={nomination.id}>
                <td className="px-4 py-3 font-medium">{nomination.member.fullName ?? nomination.member.alias ?? "Unnamed Member"}</td>
                <td className="px-4 py-3">{nomination.statement}</td>
                <td className="px-4 py-3">{nomination.slogan ?? "-"}</td>
                <td className="px-4 py-3">{nomination.status}</td>
                <td className="px-4 py-3">
                  {nomination.status === "PENDING" && !nominationActionsLocked ? (
                    <div className="flex gap-2">
                      <ElectionActionButton href={`/api/admin/elections/${id}/nominations/${nomination.id}/approve`} label="Approve" />
                      <ElectionActionButton href={`/api/admin/elections/${id}/nominations/${nomination.id}/reject`} label="Reject" body={{ reason: "Rejected by admin." }} />
                    </div>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {nominationActionsLocked ? "Locked after voting starts" : "No action available"}
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
