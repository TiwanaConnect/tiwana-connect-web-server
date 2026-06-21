import Link from "next/link";

import { TimelineCheckpointForm } from "@/components/admin/elections/election-actions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function ElectionTimelinePage({ params }: Props) {
  const { id } = await params;
  const election = await prisma.election.findUnique({
    where: { id }
  });
  const isCompleted = election?.status === "COMPLETED";
  const checkpoints = election
    ? [
        { phaseType: "NOMINATION_OPEN", title: "Nominations Open", value: election.nominationStartAt },
        { phaseType: "NOMINATION_CLOSED", title: "Nominations Close", value: election.nominationEndAt },
        { phaseType: "VOTING_OPEN", title: "Voting Opens", value: election.votingStartAt },
        { phaseType: "VOTING_CLOSED", title: "Voting Closes", value: election.votingEndAt }
      ]
    : [];

  return (
    <div className="space-y-6">
      <Link href={`/admin/elections/${id}`} className="text-sm text-primary">Back to election</Link>
      <div>
        <h1 className="text-2xl font-semibold">Timeline</h1>
        <p className="text-sm text-muted-foreground">Update the four core election dates. Changes are saved in UTC and shown in your local time.</p>
      </div>
      <div className="grid gap-3">
        {checkpoints.map((checkpoint) => (
          <div key={checkpoint.phaseType} className="rounded-lg border bg-card p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="font-semibold">{checkpoint.title}</div>
              {!isCompleted ? (
                <TimelineCheckpointForm
                  electionId={id}
                  phaseType={checkpoint.phaseType}
                  value={checkpoint.value}
                />
              ) : (
                <p className="text-sm text-muted-foreground">Election completed. Timeline is locked.</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
