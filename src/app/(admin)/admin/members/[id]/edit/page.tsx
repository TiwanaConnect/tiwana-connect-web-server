import { notFound } from "next/navigation";

import { MemberForm } from "@/components/admin/members/member-form";
import { prisma } from "@/lib/db/prisma";

export default async function EditMemberPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const member = await prisma.member.findUnique({
    where: { id },
    include: {
      relationshipsFrom: { include: { toMember: true } },
      relationshipsTo: { include: { fromMember: true } }
    }
  });

  if (!member || member.deletedAt) {
    notFound();
  }
  const relationshipCandidates = await prisma.member.findMany({
    where: { deletedAt: null, id: { not: id } },
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
  const father = member.relationshipsTo.find((relationship) => relationship.type === "FATHER")?.fromMemberId
    ?? member.relationshipsFrom.find((relationship) => relationship.type === "CHILD" && relationship.toMember.gender === "MALE")?.toMemberId
    ?? null;
  const mother = member.relationshipsTo.find((relationship) => relationship.type === "MOTHER")?.fromMemberId
    ?? member.relationshipsFrom.find((relationship) => relationship.type === "CHILD" && relationship.toMember.gender === "FEMALE")?.toMemberId
    ?? null;
  const spouseMemberIds = [
    ...member.relationshipsFrom
      .filter((relationship) => relationship.type === "SPOUSE")
      .map((relationship) => relationship.toMemberId),
    ...member.relationshipsTo
      .filter((relationship) => relationship.type === "SPOUSE")
      .map((relationship) => relationship.fromMemberId)
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Member</h1>
        <p className="text-sm text-muted-foreground">
          Update profile and privacy fields.
        </p>
      </div>
      <MemberForm
        mode="edit"
        member={member}
        currentRelationships={{
          fatherMemberId: father,
          motherMemberId: mother,
          spouseMemberIds: [...new Set(spouseMemberIds)]
        }}
        relationshipCandidates={relationshipCandidates.map((candidate) => ({
          id: candidate.id,
          gender: candidate.gender,
          label: [
            candidate.id,
            candidate.fullName ?? candidate.alias ?? "Unnamed Member",
            candidate.phone,
            candidate.city
          ]
            .filter(Boolean)
            .join(" | ")
        }))}
      />
    </div>
  );
}
