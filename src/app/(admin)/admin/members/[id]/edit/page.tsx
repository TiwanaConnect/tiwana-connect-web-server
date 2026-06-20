import { notFound } from "next/navigation";

import { MemberForm } from "@/components/admin/members/member-form";
import { prisma } from "@/lib/db/prisma";

export default async function EditMemberPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await prisma.member.findUnique({ where: { id } });

  if (!member || member.deletedAt) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Member</h1>
        <p className="text-sm text-muted-foreground">
          Update profile and privacy fields.
        </p>
      </div>
      <MemberForm mode="edit" member={member} />
    </div>
  );
}
