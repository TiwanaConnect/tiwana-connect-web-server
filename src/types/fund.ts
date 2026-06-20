import type {
  ContributionRequestStatus,
  FundPaymentMethod,
  FundStatus,
  FundTransactionStatus,
  FundTransactionType,
  FundType,
  FundVisibility
} from "@prisma/client";

export type FundLedgerDirection = "CREDIT" | "DEBIT";

export type MobileFund = {
  id: string;
  title: string;
  description: string | null;
  type: FundType;
  status: FundStatus;
  visibility: FundVisibility;
  targetAmount: string | null;
  balanceAmount: string;
  collectedAmount: string;
  spentAmount: string;
  currency: string;
  isOfficial: boolean;
  isPinned: boolean;
  startAt: string | null;
  endAt: string | null;
  createdByMemberId: string;
  createdByDisplayName: string;
  myRequestStatus?: ContributionRequestStatus | null;
  myRequestedAmount?: string | null;
  myPaidAmount?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type MobileFundTransaction = {
  id: string;
  fundId: string;
  type: FundTransactionType;
  direction: FundLedgerDirection;
  status: FundTransactionStatus;
  amount: string;
  currency: string;
  contributorMemberId: string | null;
  contributorDisplayName: string | null;
  recipientMemberId: string | null;
  recipientDisplayName: string | null;
  paymentMethod: FundPaymentMethod | null;
  referenceNumber: string | null;
  note: string | null;
  confirmedAt: string | null;
  createdAt: string;
};

export type MobileContributionRequest = {
  id: string;
  fundId: string;
  fundTitle: string;
  memberId: string;
  memberDisplayName: string;
  requestedAmount: string | null;
  paidAmount: string;
  remainingAmount: string | null;
  currency: string;
  status: ContributionRequestStatus;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};
