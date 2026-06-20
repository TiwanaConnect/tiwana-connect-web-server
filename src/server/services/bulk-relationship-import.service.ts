import { FamilyRelationshipType } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { bulkRelationshipRowSchema } from "@/lib/validators/relationship.validators";

import { parseCsv } from "./csv.service";

type PreviewRow = {
  rowNumber: number;
  data: Record<string, unknown>;
  fromMemberId?: string;
  toMemberId?: string;
  errors: string[];
  valid: boolean;
};

async function resolveMemberIdentifier(identifier: string) {
  return prisma.member.findFirst({
    where: {
      deletedAt: null,
      OR: [
        { id: identifier },
        { phone: identifier },
        { userAccount: { username: identifier } }
      ]
    },
    include: { userAccount: true }
  });
}

export async function previewBulkRelationships(csv: string): Promise<PreviewRow[]> {
  const rows = parseCsv(csv);
  const preview: PreviewRow[] = [];

  for (const [index, rawRow] of rows.entries()) {
    const data = {
      fromMemberIdentifier: String(rawRow.fromMemberIdentifier ?? ""),
      toMemberIdentifier: String(rawRow.toMemberIdentifier ?? ""),
      type: String(rawRow.type ?? "") as FamilyRelationshipType
    };
    const errors: string[] = [];
    const parsed = bulkRelationshipRowSchema.safeParse(data);

    if (!parsed.success) {
      errors.push(...parsed.error.issues.map((issue) => issue.message));
      preview.push({ rowNumber: index + 2, data, errors, valid: false });
      continue;
    }

    const fromMember = await resolveMemberIdentifier(data.fromMemberIdentifier);
    const toMember = await resolveMemberIdentifier(data.toMemberIdentifier);

    if (!fromMember) errors.push("fromMemberIdentifier not found.");
    if (!toMember) errors.push("toMemberIdentifier not found.");
    if (fromMember?.id && toMember?.id && fromMember.id === toMember.id) {
      errors.push("A member cannot relate to themselves.");
    }

    const duplicate =
      fromMember && toMember
        ? await prisma.familyRelationship.findUnique({
            where: {
              fromMemberId_toMemberId_type: {
                fromMemberId: fromMember.id,
                toMemberId: toMember.id,
                type: data.type
              }
            }
          })
        : null;

    if (duplicate) errors.push("Relationship already exists.");

    preview.push({
      rowNumber: index + 2,
      data,
      fromMemberId: fromMember?.id,
      toMemberId: toMember?.id,
      errors,
      valid: errors.length === 0
    });
  }

  return preview;
}

export async function importBulkRelationships(input: {
  csv: string;
  actorMemberId?: string;
}) {
  const preview = await previewBulkRelationships(input.csv);
  let successRows = 0;
  const failedRows: PreviewRow[] = [];

  for (const row of preview) {
    if (!row.valid || !row.fromMemberId || !row.toMemberId) {
      failedRows.push(row);
      continue;
    }

    try {
      await prisma.familyRelationship.create({
        data: {
          fromMemberId: row.fromMemberId,
          toMemberId: row.toMemberId,
          type: (row.data.type as FamilyRelationshipType) ?? "OTHER"
        }
      });
      successRows += 1;
    } catch (error) {
      failedRows.push({
        ...row,
        valid: false,
        errors: [error instanceof Error ? error.message : "Import failed."]
      });
    }
  }

  const batch = await prisma.bulkImportBatch.create({
    data: {
      type: "RELATIONSHIPS",
      totalRows: preview.length,
      successRows,
      failedRows: failedRows.length,
      createdById: input.actorMemberId,
      metadata: { failedRows } as Prisma.InputJsonObject
    }
  });

  await prisma.auditLog.create({
    data: {
      actorMemberId: input.actorMemberId,
      action: "RELATIONSHIPS_BULK_IMPORTED",
      entityType: "BULK_IMPORT",
      entityId: batch.id,
      metadata: {
        totalRows: preview.length,
        successRows,
        failedRows: failedRows.length
      } as Prisma.InputJsonObject
    }
  });

  return {
    batchId: batch.id,
    successRows,
    failedRows
  };
}
