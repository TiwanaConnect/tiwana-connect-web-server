import { MemberForm } from "@/components/admin/members/member-form";
import { prisma } from "@/lib/db/prisma";

export default async function NewMemberPage() {
  const relationshipCandidates = await prisma.member.findMany({
    where: { deletedAt: null },
    orderBy: [{ fullName: "asc" }, { alias: "asc" }],
    select: {
      id: true,
      fullName: true,
      alias: true,
      phone: true,
      city: true,
      gender: true
    }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Member</h1>
        <p className="text-sm text-muted-foreground">
          Add a family member with optional login access.
        </p>
      </div>
      <MemberForm
        mode="create"
        relationshipCandidates={relationshipCandidates.map((member) => ({
          id: member.id,
          gender: member.gender,
          label: [
            member.fullName ?? member.alias ?? "Unnamed Member",
            member.phone,
            member.city
          ]
            .filter(Boolean)
            .join(" | ")
        }))}
      />
    </div>
  );
}
