import type {
  FamilyFund,
  FundContributionRequest,
  FundTransaction,
  FundTransactionType,
  Member,
  UserAccount,
  UserRole
} from "@prisma/client";
import { Prisma } from "@prisma/client";

import { getMemberDisplayNameForViewer } from "@/lib/privacy/member-display";
import type { FundLedgerDirection, MobileContributionRequest, MobileFund, MobileFundTransaction } from "@/types/fund";

export const CREDIT_TRANSACTION_TYPES: FundTransactionType[] = [
  "CONTRIBUTION",
  "ZAKAT_INCOME",
  "SADAQAH_INCOME",
  "REFUND",
  "ADJUSTMENT"
];

export const DEBIT_TRANSACTION_TYPES: FundTransactionType[] = ["EXPENSE", "DISBURSEMENT"];

export type FundWithRelations = FamilyFund & {
  createdBy: Member & { userAccount?: UserAccount | null };
  transactions: Array<FundTransaction & {
    contributor?: Member | null;
    recipientMember?: Member | null;
    recordedBy?: Member | null;
    confirmedBy?: Member | null;
  }>;
  requests: Array<FundContributionRequest & { member: Member }>;
};

export type FundTransactionWithRelations = FundTransaction & {
  fund: FamilyFund;
  contributor?: Member | null;
  recipientMember?: Member | null;
  recordedBy?: Member | null;
  confirmedBy?: Member | null;
  request?: (FundContributionRequest & { member: Member }) | null;
};

export type FundRequestWithRelations = FundContributionRequest & {
  fund: FamilyFund;
  member: Member;
  transactions: FundTransaction[];
};

export function money(value: Prisma.Decimal | number | string | null | undefined) {
  if (value === null || value === undefined) return null;
  return new Prisma.Decimal(value).toFixed(2);
}

export function transactionDirection(type: FundTransactionType): FundLedgerDirection {
  return DEBIT_TRANSACTION_TYPES.includes(type) ? "DEBIT" : "CREDIT";
}

export function signedTransactionAmount(transaction: Pick<FundTransaction, "type" | "amount" | "status">) {
  if (transaction.status !== "CONFIRMED") return new Prisma.Decimal(0);
  const amount = new Prisma.Decimal(transaction.amount);
  return transactionDirection(transaction.type) === "DEBIT" ? amount.negated() : amount;
}

export function fundTotals(transactions: Array<Pick<FundTransaction, "type" | "amount" | "status">>) {
  return transactions.reduce(
    (totals, transaction) => {
      if (transaction.status !== "CONFIRMED") return totals;
      const amount = new Prisma.Decimal(transaction.amount);
      if (transactionDirection(transaction.type) === "DEBIT") {
        totals.spent = totals.spent.plus(amount);
        totals.balance = totals.balance.minus(amount);
      } else {
        totals.collected = totals.collected.plus(amount);
        totals.balance = totals.balance.plus(amount);
      }
      return totals;
    },
    {
      collected: new Prisma.Decimal(0),
      spent: new Prisma.Decimal(0),
      balance: new Prisma.Decimal(0)
    }
  );
}

export function toMobileFundDto(fund: FundWithRelations, viewerRole: UserRole, viewerMemberId: string): MobileFund {
  const totals = fundTotals(fund.transactions);
  const myRequest = fund.requests.find((request) => request.memberId === viewerMemberId);

  return {
    id: fund.id,
    title: fund.title,
    description: fund.description,
    type: fund.type,
    status: fund.status,
    visibility: fund.visibility,
    targetAmount: money(fund.targetAmount),
    balanceAmount: money(totals.balance) ?? "0.00",
    collectedAmount: money(totals.collected) ?? "0.00",
    spentAmount: money(totals.spent) ?? "0.00",
    currency: fund.currency,
    isOfficial: fund.isOfficial,
    isPinned: fund.isPinned,
    startAt: fund.startAt?.toISOString() ?? null,
    endAt: fund.endAt?.toISOString() ?? null,
    createdByMemberId: fund.createdById,
    createdByDisplayName: getMemberDisplayNameForViewer(fund.createdBy, viewerRole),
    myRequestStatus: myRequest?.status ?? null,
    myRequestedAmount: myRequest ? money(myRequest.requestedAmount) : null,
    myPaidAmount: myRequest ? money(myRequest.paidAmount) : null,
    createdAt: fund.createdAt.toISOString(),
    updatedAt: fund.updatedAt.toISOString()
  };
}

export function toAdminFundDto(fund: FundWithRelations) {
  const totals = fundTotals(fund.transactions);

  return {
    id: fund.id,
    title: fund.title,
    description: fund.description,
    type: fund.type,
    status: fund.status,
    visibility: fund.visibility,
    targetAmount: money(fund.targetAmount),
    balanceAmount: money(totals.balance) ?? "0.00",
    collectedAmount: money(totals.collected) ?? "0.00",
    spentAmount: money(totals.spent) ?? "0.00",
    currency: fund.currency,
    isOfficial: fund.isOfficial,
    isPinned: fund.isPinned,
    startAt: fund.startAt?.toISOString() ?? null,
    endAt: fund.endAt?.toISOString() ?? null,
    relatedEventId: fund.relatedEventId,
    createdBy: {
      id: fund.createdById,
      displayName: fund.createdBy.fullName ?? fund.createdBy.alias ?? "Unnamed Member"
    },
    transactionCount: fund.transactions.length,
    requestCount: fund.requests.length,
    createdAt: fund.createdAt.toISOString(),
    updatedAt: fund.updatedAt.toISOString()
  };
}

export function toMobileFundTransactionDto(
  transaction: FundTransactionWithRelations,
  viewerRole: UserRole
): MobileFundTransaction {
  return {
    id: transaction.id,
    fundId: transaction.fundId,
    type: transaction.type,
    direction: transactionDirection(transaction.type),
    status: transaction.status,
    amount: money(transaction.amount) ?? "0.00",
    currency: transaction.currency,
    contributorMemberId: transaction.contributorId,
    contributorDisplayName: transaction.contributor
      ? getMemberDisplayNameForViewer(transaction.contributor, viewerRole)
      : null,
    recipientMemberId: transaction.recipientMemberId,
    recipientDisplayName: transaction.recipientMember
      ? getMemberDisplayNameForViewer(transaction.recipientMember, viewerRole)
      : null,
    paymentMethod: transaction.paymentMethod,
    referenceNumber: transaction.referenceNumber,
    note: transaction.note,
    confirmedAt: transaction.confirmedAt?.toISOString() ?? null,
    createdAt: transaction.createdAt.toISOString()
  };
}

export function toAdminFundTransactionDto(transaction: FundTransactionWithRelations) {
  return {
    ...toMobileFundTransactionDto(transaction, "SUPER_ADMIN"),
    fundTitle: transaction.fund.title,
    recordedByDisplayName: transaction.recordedBy?.fullName ?? transaction.recordedBy?.alias ?? null,
    confirmedByDisplayName: transaction.confirmedBy?.fullName ?? transaction.confirmedBy?.alias ?? null,
    rejectReason: transaction.rejectReason,
    requestId: transaction.requestId
  };
}

export function toMobileContributionRequestDto(
  request: FundRequestWithRelations,
  viewerRole: UserRole
): MobileContributionRequest {
  const remaining =
    request.requestedAmount === null
      ? null
      : Prisma.Decimal.max(new Prisma.Decimal(0), new Prisma.Decimal(request.requestedAmount).minus(request.paidAmount));

  return {
    id: request.id,
    fundId: request.fundId,
    fundTitle: request.fund.title,
    memberId: request.memberId,
    memberDisplayName: getMemberDisplayNameForViewer(request.member, viewerRole),
    requestedAmount: money(request.requestedAmount),
    paidAmount: money(request.paidAmount) ?? "0.00",
    remainingAmount: money(remaining),
    currency: request.currency,
    status: request.status,
    note: request.note,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString()
  };
}

export function toAdminContributionRequestDto(request: FundRequestWithRelations) {
  return toMobileContributionRequestDto(request, "SUPER_ADMIN");
}
