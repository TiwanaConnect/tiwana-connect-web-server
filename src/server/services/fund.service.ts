import type { FundStatus, FundType, FundVisibility, Prisma, UserRole } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toAdminFundDto, toMobileFundDto } from "@/server/dto/fund.dto";
import { findFundById, findFunds } from "@/server/repositories/fund.repository";

import { recordAuditLog } from "./audit.service";

type FundPayload = {
  title?: string;
  description?: string | null;
  type?: FundType;
  status?: FundStatus;
  visibility?: FundVisibility;
  targetAmount?: string | null;
  currency?: string;
  isOfficial?: boolean;
  isPinned?: boolean;
  startAt?: string;
  endAt?: string;
  relatedEventId?: string;
  actorMemberId: string;
  admin?: boolean;
};

function parseDate(value?: string | null) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid date.", 400);
  return date;
}

function mobileVisibilityWhere(memberId: string): Prisma.FamilyFundWhereInput {
  return {
    deletedAt: null,
    status: { notIn: ["DRAFT", "ARCHIVED"] },
    OR: [
      { visibility: "ALL_FAMILY" },
      { createdById: memberId },
      { requests: { some: { memberId } } },
      { transactions: { some: { OR: [{ contributorId: memberId }, { recipientMemberId: memberId }] } } }
    ]
  };
}

export async function listAdminFunds(filters: {
  q?: string;
  status?: FundStatus;
  type?: FundType;
  visibility?: FundVisibility;
  limit: number;
  cursor?: string;
}) {
  const funds = await findFunds({
    where: {
      deletedAt: null,
      ...(filters.q
        ? {
            OR: [
              { title: { contains: filters.q, mode: "insensitive" } },
              { description: { contains: filters.q, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(filters.status ? { status: filters.status } : {}),
      ...(filters.type ? { type: filters.type } : {}),
      ...(filters.visibility ? { visibility: filters.visibility } : {})
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    ...(filters.cursor ? { cursor: { id: filters.cursor }, skip: 1 } : {}),
    take: filters.limit + 1
  });

  return {
    funds: funds.slice(0, filters.limit).map(toAdminFundDto),
    nextCursor: funds.length > filters.limit ? funds[filters.limit]?.id ?? null : null
  };
}

export async function listMobileFunds(input: {
  memberId: string;
  role: UserRole;
  q?: string;
  status?: FundStatus;
  type?: FundType;
  limit: number;
  cursor?: string;
}) {
  const funds = await findFunds({
    where: {
      ...mobileVisibilityWhere(input.memberId),
      ...(input.q
        ? {
            OR: [
              { title: { contains: input.q, mode: "insensitive" } },
              { description: { contains: input.q, mode: "insensitive" } }
            ]
          }
        : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.type ? { type: input.type } : {})
    },
    orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: input.limit + 1
  });

  return {
    funds: funds.slice(0, input.limit).map((fund) => toMobileFundDto(fund, input.role, input.memberId)),
    nextCursor: funds.length > input.limit ? funds[input.limit]?.id ?? null : null
  };
}

export async function getFundDetail(input: {
  fundId: string;
  viewerMemberId: string;
  viewerRole: UserRole;
  admin?: boolean;
}) {
  const fund = await findFundById(input.fundId);
  if (!fund || fund.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Fund not found.", 404);

  const isParticipant =
    fund.createdById === input.viewerMemberId ||
    fund.requests.some((request) => request.memberId === input.viewerMemberId) ||
    fund.transactions.some((transaction) =>
      transaction.contributorId === input.viewerMemberId || transaction.recipientMemberId === input.viewerMemberId
    );
  if (!input.admin && fund.visibility !== "ALL_FAMILY" && !isParticipant) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "You cannot view this fund.", 403);
  }

  if (input.admin) {
    return {
      fund: toAdminFundDto(fund),
      transactions: fund.transactions.map((transaction) => ({
        id: transaction.id,
        type: transaction.type,
        status: transaction.status,
        amount: transaction.amount.toFixed(2),
        currency: transaction.currency,
        contributorName: transaction.contributor?.fullName ?? transaction.contributor?.alias ?? null,
        recipientName: transaction.recipientMember?.fullName ?? transaction.recipientMember?.alias ?? null,
        createdAt: transaction.createdAt.toISOString()
      })),
      requests: fund.requests.map((request) => ({
        id: request.id,
        memberId: request.memberId,
        memberName: request.member.fullName ?? request.member.alias ?? "Unnamed Member",
        requestedAmount: request.requestedAmount?.toFixed(2) ?? null,
        paidAmount: request.paidAmount.toFixed(2),
        status: request.status
      }))
    };
  }

  return {
    fund: toMobileFundDto(fund, input.viewerRole, input.viewerMemberId)
  };
}

export async function createFund(input: FundPayload & { title: string }) {
  const creator = await prisma.member.findUnique({ where: { id: input.actorMemberId } });
  if (!creator || creator.deletedAt || creator.status === "BLOCKED") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Blocked or inactive members cannot create funds.", 403);
  }

  const fund = await prisma.familyFund.create({
    data: {
      title: input.title,
      description: input.description,
      type: input.type ?? "FAMILY_GENERAL",
      status: input.admin ? input.status ?? "ACTIVE" : "ACTIVE",
      visibility: input.visibility ?? "ALL_FAMILY",
      targetAmount: input.targetAmount ?? null,
      currency: input.currency ?? "PKR",
      isOfficial: input.admin ? input.isOfficial ?? true : false,
      isPinned: input.admin ? input.isPinned ?? false : false,
      startAt: parseDate(input.startAt),
      endAt: parseDate(input.endAt),
      relatedEventId: input.relatedEventId,
      createdById: input.actorMemberId,
      updatedById: input.actorMemberId
    },
    include: {
      createdBy: { include: { userAccount: true } },
      transactions: { where: { deletedAt: null } },
      requests: { include: { member: true } }
    }
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: input.admin ? "fund_created" : "mobile_fund_created",
    entityType: "FUND",
    entityId: fund.id
  });

  return input.admin ? toAdminFundDto(fund) : toMobileFundDto(fund, "MEMBER", input.actorMemberId);
}

export async function updateFund(fundId: string, input: FundPayload) {
  const existing = await prisma.familyFund.findUnique({ where: { id: fundId } });
  if (!existing || existing.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Fund not found.", 404);

  const fund = await prisma.familyFund.update({
    where: { id: fundId },
    data: {
      title: input.title,
      description: input.description,
      type: input.type,
      status: input.status,
      visibility: input.visibility,
      targetAmount: input.targetAmount,
      currency: input.currency,
      isOfficial: input.isOfficial,
      isPinned: input.isPinned,
      startAt: input.startAt === undefined ? undefined : parseDate(input.startAt),
      endAt: input.endAt === undefined ? undefined : parseDate(input.endAt),
      relatedEventId: input.relatedEventId,
      updatedById: input.actorMemberId
    },
    include: {
      createdBy: { include: { userAccount: true } },
      transactions: { where: { deletedAt: null } },
      requests: { include: { member: true } }
    }
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "fund_updated",
    entityType: "FUND",
    entityId: fund.id
  });

  return toAdminFundDto(fund);
}

export async function setFundStatus(input: {
  fundId: string;
  status: Extract<FundStatus, "CLOSED" | "CANCELLED" | "ARCHIVED">;
  actorMemberId: string;
}) {
  const fund = await prisma.familyFund.update({
    where: { id: input.fundId },
    data: { status: input.status, updatedById: input.actorMemberId },
    include: {
      createdBy: { include: { userAccount: true } },
      transactions: { where: { deletedAt: null } },
      requests: { include: { member: true } }
    }
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action:
      input.status === "CLOSED"
        ? "fund_closed"
        : input.status === "CANCELLED"
          ? "fund_cancelled"
          : "fund_archived",
    entityType: "FUND",
    entityId: fund.id
  });

  return toAdminFundDto(fund);
}
