import Link from "next/link";
import { notFound } from "next/navigation";

import { HelpRequestCancelButton } from "@/components/admin/directory/directory-actions";
import { prisma } from "@/lib/db/prisma";
import { helpRequestInclude } from "@/server/repositories/help-request.repository";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ id: string }> };

export default async function HelpRequestDetailPage({ params }: Props) {
  const { id } = await params;
  const request = await prisma.memberHelpRequest.findUnique({ where: { id }, include: helpRequestInclude });
  if (!request || request.deletedAt) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/help-requests" className="text-sm text-primary">Back to help requests</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{request.title}</h1>
        <p className="text-sm text-muted-foreground">{request.priority} · {request.status} · {request.category ?? "No category"}</p>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div><div className="text-xs uppercase text-muted-foreground">From</div><div className="font-medium">{request.fromMember.fullName ?? request.fromMember.alias ?? "Unnamed Member"}</div></div>
          <div><div className="text-xs uppercase text-muted-foreground">To</div><div className="font-medium">{request.toMember.fullName ?? request.toMember.alias ?? "Unnamed Member"}</div></div>
        </div>
        <p className="mt-4 whitespace-pre-wrap text-sm">{request.message}</p>
        {request.responseMessage ? <p className="mt-4 whitespace-pre-wrap rounded-md bg-muted p-3 text-sm">{request.responseMessage}</p> : null}
      </div>
      <HelpRequestCancelButton requestId={request.id} />
    </div>
  );
}
