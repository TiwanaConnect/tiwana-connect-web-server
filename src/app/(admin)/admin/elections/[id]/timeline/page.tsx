import Link from "next/link";

import { ElectionTimelineForm } from "@/components/admin/elections/election-actions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";
type Props = { params: Promise<{ id: string }> };

export default async function ElectionTimelinePage({ params }: Props) {
  const { id } = await params;
  const election = await prisma.election.findUnique({
    where: { id }
  });
  const isCompleted = election?.status === "COMPLETED";

  return (
    <div className="space-y-6">
      <Link href={`/admin/elections/${id}`} className="text-sm text-primary">Back to election</Link>
      <div>
        <h1 className="text-2xl font-semibold">Timeline</h1>
        <p className="text-sm text-muted-foreground">These four dates are display/planning dates only. Election status changes happen from manual admin buttons.</p>
      </div>
      {election ? (
        <ElectionTimelineForm
          electionId={id}
          nominationStartAt={election.nominationStartAt}
          nominationEndAt={election.nominationEndAt}
          votingStartAt={election.votingStartAt}
          votingEndAt={election.votingEndAt}
          disabled={isCompleted}
        />
      ) : null}
      {isCompleted ? <p className="text-sm text-muted-foreground">Election completed. Timeline dates are locked.</p> : null}
    </div>
  );
}
