import type { ContributionRequestStatus, Prisma, UserRole } from "@prisma/client";
import { Prisma as PrismaNamespace } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toAdminContributionRequestDto, toMobileContributionRequestDto } from "@/server/dto/fund.dto";
import { findFundRequestById, findFundRequests } from "@/server/repositories/fund-request.repository";

import { recordAuditLog } from "./audit.service";
import { notifyMembers } from "./notification.service";

export function contributionRequestStatus(requestedAmount: PrismaNamespace.Decimal | null, paidAmount: PrismaNamespace.Decimal) {
  if (requestedAmount === null) {
    return paidAmount.gt(0) ? "PARTIALLY_PAID" : "PENDING";
  }
  if (paidAmount.gte(requestedAmount)) return "PAID";
  if (paidAmount.gt(0)) return "PARTIALLY_PAID";
  return "PENDING";
}

export async function syncContributionRequestPaidAmount(requestId: string, tx: Prisma.TransactionClient = prisma) {
  const request = await tx.fundContributionRequest.findUnique({
    where: { id: requestId },
    include: {
      transactions: {
        where: {
          deletedAt: null,
          status: "CONFIRMED",
          type: { in: ["CONTRIBUTION", "ZAKAT_INCOME", "SADAQAH_INCOME"] }
        }
      }
    }
  });

  if (!request || request.status === "WAIVED" || request.status === "CANCELLED") return request;

  const paidAmount = request.transactions.reduce(
    (sum, transaction) => sum.plus(transaction.amount),
    new PrismaNamespace.Decimal(0)
  );
  return tx.fundContributionRequest.update({
    where: { id: requestId },
    data: {
      paidAmount,
      status: contributionRequestStatus(request.requestedAmount, paidAmount)
    }
  });
}

export async function listContributionRequests(input: {
  fundId?: string;
  memberId?: string;
  status?: ContributionRequestStatus;
  limit: number;
  cursor?: string;
  admin?: boolean;
  viewerRole: UserRole;
}) {
  const requests = await findFundRequests({
    where: {
      ...(input.fundId ? { fundId: input.fundId } : {}),
      ...(input.memberId ? { memberId: input.memberId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.admin ? {} : { fund: { deletedAt: null, status: { notIn: ["DRAFT", "ARCHIVED"] } } })
    },
    orderBy: { createdAt: "desc" },
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: input.limit + 1
  });

  return {
    requests: requests
      .slice(0, input.limit)
      .map((request) => input.admin ? toAdminContributionRequestDto(request) : toMobileContributionRequestDto(request, input.viewerRole)),
    nextCursor: requests.length > input.limit ? requests[input.limit]?.id ?? null : null
  };
}

export async function createContributionRequests(input: {
  fundId: string;
  memberIds: string[];
  requestedAmount?: string | null;
  currency: string;
  note?: string | null;
  actorMemberId: string;
  admin?: boolean;
}) {
  const fund = await prisma.familyFund.findUnique({ where: { id: input.fundId } });
  if (!fund || fund.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Fund not found.", 404);
  if (!input.admin && fund.status !== "ACTIVE") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Contribution requests are only open for active funds.", 403);
  }

  const memberIds = [...new Set(input.memberIds)];
  const members = await prisma.member.findMany({
    where: { id: { in: memberIds }, deletedAt: null, status: "ACTIVE" },
    select: { id: true }
  });
  if (members.length !== memberIds.length) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "One or more members are not active.", 400);
  }

  const requests = await prisma.$transaction(async (tx) => {
    const created = [];
    for (const memberId of memberIds) {
      created.push(
        await tx.fundContributionRequest.upsert({
          where: { fundId_memberId: { fundId: input.fundId, memberId } },
          update: {
            requestedAmount: input.requestedAmount ?? null,
            currency: input.currency,
            note: input.note,
            requestedById: input.actorMemberId,
            status: "PENDING"
          },
          create: {
            fundId: input.fundId,
            memberId,
            requestedAmount: input.requestedAmount ?? null,
            currency: input.currency,
            note: input.note,
            requestedById: input.actorMemberId
          }
        })
      );
    }
    return created;
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: input.admin ? "fund_requests_created" : "fund_request_created",
    entityType: "FUND",
    entityId: input.fundId,
    metadata: { requestIds: requests.map((request) => request.id), memberIds }
  });

  await notifyMembers({
    memberIds,
    type: "FUND_REQUEST",
    title: `Contribution request: ${fund.title}`,
    body: "A family fund contribution request was assigned to you.",
    entityType: "FUND",
    entityId: input.fundId,
    actionLabel: "View fund",
    actionUrl: `/funds/${input.fundId}`,
    priority: "NORMAL",
    metadata: { requestIds: requests.map((request) => request.id) },
    push: true
  });

  return { requests };
}

export async function updateContributionRequest(input: {
  requestId: string;
  requestedAmount?: string | null;
  paidAmount?: string;
  status?: ContributionRequestStatus;
  note?: string | null;
  actorMemberId: string;
}) {
  const existing = await findFundRequestById(input.requestId);
  if (!existing) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Contribution request not found.", 404);

  const paidAmount = input.paidAmount === undefined ? existing.paidAmount : new PrismaNamespace.Decimal(input.paidAmount);
  const requestedAmount =
    input.requestedAmount === undefined
      ? existing.requestedAmount
      : input.requestedAmount === null
        ? null
        : new PrismaNamespace.Decimal(input.requestedAmount);

  const request = await prisma.fundContributionRequest.update({
    where: { id: input.requestId },
    data: {
      requestedAmount,
      paidAmount,
      status: input.status ?? contributionRequestStatus(requestedAmount, paidAmount),
      note: input.note
    },
    include: { fund: true, member: true, transactions: { where: { deletedAt: null } } }
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "fund_request_updated",
    entityType: "FUND",
    entityId: request.fundId,
    metadata: { requestId: request.id }
  });

  return toAdminContributionRequestDto(request);
}

export async function setContributionRequestStatus(input: {
  requestId: string;
  status: Extract<ContributionRequestStatus, "WAIVED" | "CANCELLED">;
  actorMemberId: string;
}) {
  const request = await prisma.fundContributionRequest.update({
    where: { id: input.requestId },
    data: { status: input.status },
    include: { fund: true, member: true, transactions: { where: { deletedAt: null } } }
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: input.status === "WAIVED" ? "fund_request_waived" : "fund_request_cancelled",
    entityType: "FUND",
    entityId: request.fundId,
    metadata: { requestId: request.id }
  });

  return toAdminContributionRequestDto(request);
}
