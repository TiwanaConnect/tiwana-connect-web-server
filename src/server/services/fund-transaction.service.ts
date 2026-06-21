import type { FundTransactionStatus, FundTransactionType, Prisma, UserRole } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toAdminFundTransactionDto, toMobileFundTransactionDto } from "@/server/dto/fund.dto";
import { findFundTransactionById, findFundTransactions } from "@/server/repositories/fund-transaction.repository";

import { recordAuditLog } from "./audit.service";
import { syncContributionRequestPaidAmount } from "./fund-request.service";
import { notifyMembers } from "./notification.service";

type TransactionPayload = {
  fundId: string;
  type: FundTransactionType;
  status?: FundTransactionStatus;
  amount: string;
  currency: string;
  contributorId?: string;
  recipientMemberId?: string;
  paymentMethod?: "CASH" | "BANK_TRANSFER" | "EASYPAISA" | "JAZZCASH" | "OTHER";
  referenceNumber?: string | null;
  note?: string | null;
  requestId?: string;
  actorMemberId: string;
  admin?: boolean;
};

export async function listFundTransactions(input: {
  fundId?: string;
  status?: FundTransactionStatus;
  type?: FundTransactionType;
  memberId?: string;
  viewerRole: UserRole;
  admin?: boolean;
  limit: number;
  cursor?: string;
}) {
  const transactions = await findFundTransactions({
    where: {
      deletedAt: null,
      ...(input.fundId ? { fundId: input.fundId } : {}),
      ...(input.status ? { status: input.status } : {}),
      ...(input.type ? { type: input.type } : {}),
      ...(input.memberId ? { OR: [{ contributorId: input.memberId }, { recipientMemberId: input.memberId }] } : {}),
      ...(input.admin ? {} : { fund: { deletedAt: null, status: { notIn: ["DRAFT", "ARCHIVED"] } } })
    },
    orderBy: { createdAt: "desc" },
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: input.limit + 1
  });

  return {
    transactions: transactions
      .slice(0, input.limit)
      .map((transaction) => input.admin ? toAdminFundTransactionDto(transaction) : toMobileFundTransactionDto(transaction, input.viewerRole)),
    nextCursor: transactions.length > input.limit ? transactions[input.limit]?.id ?? null : null
  };
}

async function assertMemberCanRecordContribution(input: TransactionPayload) {
  const fund = await prisma.familyFund.findUnique({ where: { id: input.fundId } });
  if (!fund || fund.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Fund not found.", 404);
  if (input.admin && fund.type !== "FAMILY_GENERAL") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Admins can only control family funds.", 403);
  }
  if (!input.admin && fund.type !== "GENERAL") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Members can only contribute to general funds.", 403);
  }
  if (!input.admin && fund.status !== "ACTIVE") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Contributions are only open for active funds.", 403);
  }
  if (!input.admin && !["CONTRIBUTION", "ZAKAT_INCOME", "SADAQAH_INCOME"].includes(input.type)) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Members can only record contributions.", 403);
  }
}

export async function createFundTransaction(input: TransactionPayload) {
  await assertMemberCanRecordContribution(input);
  const contributorId = input.admin ? input.contributorId : input.actorMemberId;
  const status = input.admin ? input.status ?? "CONFIRMED" : "PENDING";

  if (input.requestId) {
    const request = await prisma.fundContributionRequest.findUnique({ where: { id: input.requestId } });
    if (!request || request.fundId !== input.fundId) {
      throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Contribution request does not belong to this fund.", 400);
    }
    if (!input.admin && request.memberId !== input.actorMemberId) {
      throw new AppError(API_ERROR_CODES.FORBIDDEN, "You can only contribute against your own request.", 403);
    }
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const created = await tx.fundTransaction.create({
      data: {
        fundId: input.fundId,
        type: input.type,
        status,
        amount: input.amount,
        currency: input.currency,
        contributorId,
        recipientMemberId: input.recipientMemberId,
        paymentMethod: input.paymentMethod,
        referenceNumber: input.referenceNumber,
        note: input.note,
        requestId: input.requestId,
        recordedById: input.actorMemberId,
        confirmedById: status === "CONFIRMED" ? input.actorMemberId : undefined,
        confirmedAt: status === "CONFIRMED" ? new Date() : undefined
      },
      include: {
        fund: true,
        contributor: true,
        recipientMember: true,
        recordedBy: true,
        confirmedBy: true,
        request: { include: { member: true } }
      }
    });
    if (created.requestId && created.status === "CONFIRMED") {
      await syncContributionRequestPaidAmount(created.requestId, tx);
    }
    return created;
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: input.admin ? "fund_transaction_created" : "fund_contribution_submitted",
    entityType: "FUND",
    entityId: input.fundId,
    metadata: { transactionId: transaction.id, status: transaction.status }
  });

  if (transaction.status === "CONFIRMED" && transaction.type === "DISBURSEMENT" && transaction.recipientMemberId) {
    await notifyMembers({
      memberIds: [transaction.recipientMemberId],
      type: "FUND_CONTRIBUTION",
      title: `Fund disbursement recorded: ${transaction.fund.title}`,
      body: "A family fund disbursement was recorded for you.",
      entityType: "FUND",
      entityId: transaction.fundId,
      actionLabel: "View fund",
      actionUrl: `/funds/${transaction.fundId}`,
      priority: "NORMAL",
      metadata: { transactionId: transaction.id },
      push: true
    });
  }

  return input.admin ? toAdminFundTransactionDto(transaction) : toMobileFundTransactionDto(transaction, "MEMBER");
}

export async function confirmFundTransaction(input: { transactionId: string; actorMemberId: string }) {
  const existing = await findFundTransactionById(input.transactionId);
  if (!existing || existing.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Transaction not found.", 404);
  if (existing.fund.type !== "FAMILY_GENERAL") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Admins can only approve family fund transactions.", 403);
  }
  if (existing.status === "CONFIRMED") return toAdminFundTransactionDto(existing);

  const transaction = await prisma.$transaction(async (tx) => {
    const updated = await tx.fundTransaction.update({
      where: { id: input.transactionId },
      data: {
        status: "CONFIRMED",
        confirmedById: input.actorMemberId,
        confirmedAt: new Date(),
        rejectedById: null,
        rejectedAt: null,
        rejectReason: null
      },
      include: {
        fund: true,
        contributor: true,
        recipientMember: true,
        recordedBy: true,
        confirmedBy: true,
        request: { include: { member: true } }
      }
    });
    if (updated.requestId) await syncContributionRequestPaidAmount(updated.requestId, tx);
    return updated;
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "fund_transaction_confirmed",
    entityType: "FUND",
    entityId: transaction.fundId,
    metadata: { transactionId: transaction.id }
  });

  if (transaction.contributorId) {
    await notifyMembers({
      memberIds: [transaction.contributorId],
      type: "FUND_TRANSACTION_CONFIRMED",
      title: `Contribution confirmed: ${transaction.fund.title}`,
      body: "Your fund contribution has been confirmed.",
      entityType: "FUND",
      entityId: transaction.fundId,
      actionLabel: "View fund",
      actionUrl: `/funds/${transaction.fundId}`,
      priority: "NORMAL",
      metadata: { transactionId: transaction.id },
      push: true
    });
  }

  return toAdminFundTransactionDto(transaction);
}

export async function rejectFundTransaction(input: { transactionId: string; actorMemberId: string; reason?: string | null }) {
  const existing = await findFundTransactionById(input.transactionId);
  if (!existing || existing.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Transaction not found.", 404);
  if (existing.fund.type !== "FAMILY_GENERAL") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Admins can only reject family fund transactions.", 403);
  }

  const transaction = await prisma.$transaction(async (tx) => {
    const updated = await tx.fundTransaction.update({
      where: { id: input.transactionId },
      data: {
        status: "REJECTED",
        rejectedById: input.actorMemberId,
        rejectedAt: new Date(),
        rejectReason: input.reason,
        confirmedById: null,
        confirmedAt: null
      },
      include: {
        fund: true,
        contributor: true,
        recipientMember: true,
        recordedBy: true,
        confirmedBy: true,
        request: { include: { member: true } }
      }
    });
    if (updated.requestId) await syncContributionRequestPaidAmount(updated.requestId, tx);
    return updated;
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "fund_transaction_rejected",
    entityType: "FUND",
    entityId: transaction.fundId,
    metadata: { transactionId: transaction.id, reason: input.reason }
  });

  if (transaction.contributorId) {
    await notifyMembers({
      memberIds: [transaction.contributorId],
      type: "FUND_TRANSACTION_REJECTED",
      title: `Contribution rejected: ${transaction.fund.title}`,
      body: "Your fund contribution was rejected. Open the fund for details.",
      entityType: "FUND",
      entityId: transaction.fundId,
      actionLabel: "View fund",
      actionUrl: `/funds/${transaction.fundId}`,
      priority: "HIGH",
      metadata: { transactionId: transaction.id },
      push: true
    });
  }

  return toAdminFundTransactionDto(transaction);
}

export async function confirmGeneralFundTransaction(input: { transactionId: string; actorMemberId: string }) {
  const existing = await findFundTransactionById(input.transactionId);
  if (!existing || existing.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Transaction not found.", 404);
  if (existing.fund.type !== "GENERAL") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Only general fund transactions can be approved in mobile.", 403);
  }
  if (existing.fund.createdById !== input.actorMemberId) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Only the general fund creator can approve this transaction.", 403);
  }
  if (existing.status === "CONFIRMED") return toMobileFundTransactionDto(existing, "MEMBER");

  const transaction = await prisma.$transaction(async (tx) => {
    const updated = await tx.fundTransaction.update({
      where: { id: input.transactionId },
      data: {
        status: "CONFIRMED",
        confirmedById: input.actorMemberId,
        confirmedAt: new Date(),
        rejectedById: null,
        rejectedAt: null,
        rejectReason: null
      },
      include: {
        fund: true,
        contributor: true,
        recipientMember: true,
        recordedBy: true,
        confirmedBy: true,
        request: { include: { member: true } }
      }
    });
    if (updated.requestId) await syncContributionRequestPaidAmount(updated.requestId, tx);
    return updated;
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "general_fund_transaction_confirmed",
    entityType: "FUND",
    entityId: transaction.fundId,
    metadata: { transactionId: transaction.id }
  });

  return toMobileFundTransactionDto(transaction, "MEMBER");
}

export async function rejectGeneralFundTransaction(input: { transactionId: string; actorMemberId: string; reason?: string | null }) {
  const existing = await findFundTransactionById(input.transactionId);
  if (!existing || existing.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Transaction not found.", 404);
  if (existing.fund.type !== "GENERAL") {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Only general fund transactions can be rejected in mobile.", 403);
  }
  if (existing.fund.createdById !== input.actorMemberId) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Only the general fund creator can reject this transaction.", 403);
  }

  const transaction = await prisma.fundTransaction.update({
    where: { id: input.transactionId },
    data: {
      status: "REJECTED",
      rejectedById: input.actorMemberId,
      rejectedAt: new Date(),
      rejectReason: input.reason,
      confirmedById: null,
      confirmedAt: null
    },
    include: {
      fund: true,
      contributor: true,
      recipientMember: true,
      recordedBy: true,
      confirmedBy: true,
      request: { include: { member: true } }
    }
  });

  await recordAuditLog({
    actorMemberId: input.actorMemberId,
    action: "general_fund_transaction_rejected",
    entityType: "FUND",
    entityId: transaction.fundId,
    metadata: { transactionId: transaction.id, reason: input.reason }
  });

  return toMobileFundTransactionDto(transaction, "MEMBER");
}
