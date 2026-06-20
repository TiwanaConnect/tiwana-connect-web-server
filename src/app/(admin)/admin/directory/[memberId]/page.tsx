import Link from "next/link";
import { notFound } from "next/navigation";

import { DirectorySettingsForm, TagAssignmentForm } from "@/components/admin/directory/directory-actions";
import { prisma } from "@/lib/db/prisma";
import { toAdminDirectoryMemberDto } from "@/server/dto/directory.dto";
import { directoryMemberInclude } from "@/server/repositories/directory.repository";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ memberId: string }> };

export default async function DirectoryMemberPage({ params }: Props) {
  const { memberId } = await params;
  const rawMember = await prisma.member.findUnique({ where: { id: memberId }, include: directoryMemberInclude });
  if (!rawMember || rawMember.deletedAt) notFound();
  const member = toAdminDirectoryMemberDto(rawMember);
  const tags = await prisma.memberTag.findMany({ where: { isActive: true }, orderBy: { name: "asc" } });
  const sent = await prisma.memberHelpRequest.count({ where: { fromMemberId: memberId, deletedAt: null } });
  const received = await prisma.memberHelpRequest.count({ where: { toMemberId: memberId, deletedAt: null } });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/directory" className="text-sm text-primary">Back to directory</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">{member.displayName}</h1>
        <p className="text-sm text-muted-foreground">{member.gender} · {member.city ?? "No city"} · {member.profession ?? "No profession"}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Phone</div><div className="mt-1 font-medium">{member.phone ?? "-"}</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Tags</div><div className="mt-1 font-medium">{member.tags.length}</div></div>
        <div className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">Help requests</div><div className="mt-1 font-medium">{sent} sent · {received} received</div></div>
      </div>
      <div className="rounded-lg border bg-card p-4">
        <h2 className="font-semibold">Tags</h2>
        <p className="mt-2 text-sm text-muted-foreground">{member.tags.map((tag) => tag.name).join(", ") || "No tags assigned."}</p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <DirectorySettingsForm memberId={member.id} setting={member} />
        <TagAssignmentForm memberId={member.id} tags={tags.map((tag) => ({ id: tag.id, name: tag.name, type: tag.type }))} />
      </div>
    </div>
  );
}
