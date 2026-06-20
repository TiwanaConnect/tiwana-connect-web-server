import type { Prisma } from "@prisma/client";

import { prisma } from "@/lib/db/prisma";

export function createBulkImportBatch(input: {
  type: string;
  totalRows: number;
  successRows: number;
  failedRows: number;
  createdById?: string;
  metadata?: unknown;
}) {
  return prisma.bulkImportBatch.create({
    data: {
      type: input.type,
      totalRows: input.totalRows,
      successRows: input.successRows,
      failedRows: input.failedRows,
      createdById: input.createdById,
      metadata: input.metadata as Prisma.InputJsonValue
    }
  });
}
