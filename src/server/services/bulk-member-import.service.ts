import { MemberGender, UserRole, VisibilityStatus } from "@prisma/client";
import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";
import { generateTemporaryPassword, hashPassword } from "@/lib/auth/password";
import { bulkMemberRowSchema } from "@/lib/validators/bulk-import.validators";

import { generateUniqueMemberId, getDefaultVisibility, normalizeDate } from "./member.service";
import { parseBoolean, parseCsv } from "./csv.service";

type PreviewRow = {
  rowNumber: number;
  data: Record<string, unknown>;
  errors: string[];
  valid: boolean;
};

function initialsFromName(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

function normalizeRow(row: Record<string, string>) {
  return {
    fullName: row.fullName || undefined,
    alias: row.alias || undefined,
    gender: row.gender as MemberGender,
    visibility: row.visibility ? (row.visibility as VisibilityStatus) : undefined,
    isFamilyHead: parseBoolean(row.isFamilyHead),
    city: row.city || undefined,
    phone: row.phone || undefined,
    profession: row.profession || undefined,
    branchLabel: row.branchLabel || undefined,
    dateOfBirth: row.dateOfBirth || undefined,
    notes: row.notes || undefined,
    createLogin: parseBoolean(row.createLogin),
    username: row.username || undefined,
    role: row.role ? (row.role as UserRole) : UserRole.MEMBER
  };
}

export function previewBulkMembers(csv: string): PreviewRow[] {
  return parseCsv(csv).map((row, index) => {
    const data = normalizeRow(row as Record<string, string>);
    const parsed = bulkMemberRowSchema.safeParse(data);

    return {
      rowNumber: index + 2,
      data,
      errors: parsed.success
        ? []
        : parsed.error.issues.map((issue) => issue.message),
      valid: parsed.success
    };
  });
}

export async function importBulkMembers(input: {
  csv: string;
  actorMemberId?: string;
}) {
  const preview = previewBulkMembers(input.csv);
  const generatedCredentials: Array<{
    memberName: string;
    username: string;
    temporaryPassword: string;
  }> = [];

  let successRows = 0;
  const failedRows: PreviewRow[] = [];

  for (const row of preview) {
    if (!row.valid) {
      failedRows.push(row);
      continue;
    }

    const data = row.data as ReturnType<typeof normalizeRow>;
    const temporaryPassword = data.createLogin ? generateTemporaryPassword() : undefined;

    try {
      await prisma.member.create({
        data: {
          id: await generateUniqueMemberId(),
          fullName: data.fullName,
          alias: data.alias,
          initials: initialsFromName(data.fullName ?? data.alias ?? "Member"),
          gender: data.gender,
          visibility: getDefaultVisibility(data.gender, data.visibility),
          isFamilyHead: data.isFamilyHead,
          city: data.city,
          phone: data.phone,
          profession: data.profession,
          branchLabel: data.branchLabel,
          dateOfBirth: normalizeDate(data.dateOfBirth),
          notes: data.notes,
          ...(data.createLogin && data.username && temporaryPassword
            ? {
                userAccount: {
                  create: {
                    username: data.username,
                    passwordHash: await hashPassword(temporaryPassword),
                    role: data.role,
                    mustChangePassword: true
                  }
                }
              }
            : {})
        }
      });

      if (data.createLogin && data.username && temporaryPassword) {
        generatedCredentials.push({
          memberName: data.fullName ?? data.alias ?? data.username,
          username: data.username,
          temporaryPassword
        });
      }

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
      type: "MEMBERS",
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
      action: "MEMBERS_BULK_IMPORTED",
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
    failedRows,
    generatedCredentials
  };
}
