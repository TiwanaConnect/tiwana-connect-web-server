import {
  CandidateStatus,
  ElectionResultStatus,
  ElectionStatus,
  FamilyRelationshipType,
  FundPaymentMethod,
  FundTransactionStatus,
  FundTransactionType,
  FundType,
  HelpRequestPriority,
  HelpRequestStatus,
  MemberGender,
  MemberTagType,
  NominationStatus,
  PrismaClient,
  UserRole,
  VisibilityStatus,
  RSVPStatus
} from "@prisma/client";

import { hashPassword } from "../src/lib/auth/password";

const prisma = new PrismaClient();

async function upsertMember(input: {
  id: string;
  fullName?: string;
  alias?: string;
  initials: string;
  gender: MemberGender;
  visibility?: VisibilityStatus;
  isFamilyHead?: boolean;
  city?: string;
  phone?: string;
  profession?: string;
  branchLabel?: string;
}) {
  return prisma.member.upsert({
    where: { id: input.id },
    update: {
      fullName: input.fullName,
      alias: input.alias,
      initials: input.initials,
      gender: input.gender,
      visibility: input.visibility ?? VisibilityStatus.VISIBLE,
      isFamilyHead: input.isFamilyHead ?? false,
      status: "ACTIVE",
      city: input.city,
      phone: input.phone,
      profession: input.profession,
      branchLabel: input.branchLabel
    },
    create: {
      ...input,
      visibility: input.visibility ?? VisibilityStatus.VISIBLE,
      isFamilyHead: input.isFamilyHead ?? false,
      status: "ACTIVE"
    }
  });
}

async function upsertUserAccount(input: {
  memberId: string;
  username: string;
  password: string;
  role: UserRole;
}) {
  return prisma.userAccount.upsert({
    where: { username: input.username },
    update: {
      memberId: input.memberId,
      role: input.role,
      isActive: true
    },
    create: {
      memberId: input.memberId,
      username: input.username,
      passwordHash: await hashPassword(input.password),
      role: input.role,
      mustChangePassword: true,
      isActive: true
    }
  });
}

async function upsertNotificationPreference(memberId: string) {
  return prisma.notificationPreference.upsert({
    where: { memberId },
    update: {},
    create: { memberId }
  });
}

async function upsertRelationship(input: {
  fromMemberId: string;
  toMemberId: string;
  type: FamilyRelationshipType;
}) {
  return prisma.familyRelationship.upsert({
    where: {
      fromMemberId_toMemberId_type: input
    },
    update: {},
    create: input
  });
}

async function upsertEvent(input: {
  id: string;
  title: string;
  type?: "FAMILY_EVENT" | "OFFICIAL_MEETING" | "EID_GATHERING" | "REUNION";
  status?: "PUBLISHED" | "CANCELLED" | "COMPLETED";
  visibility?: "ALL_FAMILY" | "INVITED_ONLY";
  isOfficial?: boolean;
  isPinned?: boolean;
  startAt: Date;
  endAt?: Date;
  locationName?: string;
  createdById: string;
}) {
  return prisma.familyEvent.upsert({
    where: { id: input.id },
    update: {
      title: input.title,
      type: input.type ?? "FAMILY_EVENT",
      status: input.status ?? "PUBLISHED",
      visibility: input.visibility ?? "INVITED_ONLY",
      isOfficial: input.isOfficial ?? false,
      isPinned: input.isPinned ?? false,
      startAt: input.startAt,
      endAt: input.endAt,
      locationName: input.locationName
    },
    create: {
      ...input,
      type: input.type ?? "FAMILY_EVENT",
      status: input.status ?? "PUBLISHED",
      visibility: input.visibility ?? "INVITED_ONLY",
      isOfficial: input.isOfficial ?? false,
      isPinned: input.isPinned ?? false
    }
  });
}

async function upsertInvite(input: {
  eventId: string;
  memberId: string;
  invitedById?: string;
  rsvpStatus?: RSVPStatus;
}) {
  return prisma.eventInvite.upsert({
    where: {
      eventId_memberId: {
        eventId: input.eventId,
        memberId: input.memberId
      }
    },
    update: {
      rsvpStatus: input.rsvpStatus ?? RSVPStatus.PENDING,
      respondedAt:
        input.rsvpStatus && input.rsvpStatus !== RSVPStatus.PENDING
          ? new Date()
          : null
    },
    create: {
      eventId: input.eventId,
      memberId: input.memberId,
      invitedById: input.invitedById,
      source: "MANUAL",
      rsvpStatus: input.rsvpStatus ?? RSVPStatus.PENDING,
      respondedAt:
        input.rsvpStatus && input.rsvpStatus !== RSVPStatus.PENDING
          ? new Date()
          : null
    }
  });
}

async function upsertFund(input: {
  id: string;
  title: string;
  description?: string;
  type?: FundType;
  status?: "DRAFT" | "ACTIVE" | "CLOSED" | "CANCELLED" | "ARCHIVED";
  visibility?: "ALL_FAMILY" | "INVITED_ONLY" | "ADMIN_ONLY";
  targetAmount?: string;
  isOfficial?: boolean;
  isPinned?: boolean;
  createdById: string;
  relatedEventId?: string;
}) {
  return prisma.familyFund.upsert({
    where: { id: input.id },
    update: {
      title: input.title,
      description: input.description,
      type: input.type ?? FundType.FAMILY_GENERAL,
      status: input.status ?? "ACTIVE",
      visibility: input.visibility ?? "ALL_FAMILY",
      targetAmount: input.targetAmount,
      isOfficial: input.isOfficial ?? true,
      isPinned: input.isPinned ?? false,
      relatedEventId: input.relatedEventId
    },
    create: {
      ...input,
      type: input.type ?? FundType.FAMILY_GENERAL,
      status: input.status ?? "ACTIVE",
      visibility: input.visibility ?? "ALL_FAMILY",
      targetAmount: input.targetAmount,
      isOfficial: input.isOfficial ?? true,
      isPinned: input.isPinned ?? false
    }
  });
}

async function upsertFundTransaction(input: {
  id: string;
  fundId: string;
  type: FundTransactionType;
  status?: FundTransactionStatus;
  amount: string;
  contributorId?: string;
  recipientMemberId?: string;
  paymentMethod?: FundPaymentMethod;
  referenceNumber?: string;
  note?: string;
  recordedById: string;
  confirmedById?: string;
  requestId?: string;
}) {
  const status = input.status ?? FundTransactionStatus.CONFIRMED;
  return prisma.fundTransaction.upsert({
    where: { id: input.id },
    update: {
      type: input.type,
      status,
      amount: input.amount,
      contributorId: input.contributorId,
      recipientMemberId: input.recipientMemberId,
      paymentMethod: input.paymentMethod,
      referenceNumber: input.referenceNumber,
      note: input.note,
      recordedById: input.recordedById,
      confirmedById: status === FundTransactionStatus.CONFIRMED ? input.confirmedById ?? input.recordedById : null,
      confirmedAt: status === FundTransactionStatus.CONFIRMED ? new Date() : null,
      requestId: input.requestId
    },
    create: {
      ...input,
      status,
      confirmedById: status === FundTransactionStatus.CONFIRMED ? input.confirmedById ?? input.recordedById : undefined,
      confirmedAt: status === FundTransactionStatus.CONFIRMED ? new Date() : undefined
    }
  });
}

async function upsertContributionRequest(input: {
  fundId: string;
  memberId: string;
  requestedAmount?: string;
  paidAmount?: string;
  status?: "PENDING" | "PAID" | "PARTIALLY_PAID" | "WAIVED" | "CANCELLED";
  requestedById: string;
  note?: string;
}) {
  return prisma.fundContributionRequest.upsert({
    where: {
      fundId_memberId: {
        fundId: input.fundId,
        memberId: input.memberId
      }
    },
    update: {
      requestedAmount: input.requestedAmount,
      paidAmount: input.paidAmount ?? "0",
      status: input.status ?? "PENDING",
      requestedById: input.requestedById,
      note: input.note
    },
    create: {
      ...input,
      paidAmount: input.paidAmount ?? "0",
      status: input.status ?? "PENDING"
    }
  });
}

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

async function upsertTag(input: {
  name: string;
  type: MemberTagType;
  color?: string;
}) {
  return prisma.memberTag.upsert({
    where: { slug: slugify(input.name) },
    update: {
      name: input.name,
      type: input.type,
      color: input.color,
      isActive: true
    },
    create: {
      name: input.name,
      slug: slugify(input.name),
      type: input.type,
      color: input.color
    }
  });
}

async function upsertDirectorySetting(input: {
  memberId: string;
  showPhone?: boolean;
  bio?: string;
  availabilityNote?: string;
  allowHelpRequests?: boolean;
}) {
  return prisma.memberDirectorySetting.upsert({
    where: { memberId: input.memberId },
    update: input,
    create: input
  });
}

async function assignTag(memberId: string, tagId: string, assignedById: string) {
  return prisma.memberTagAssignment.upsert({
    where: { memberId_tagId: { memberId, tagId } },
    update: { assignedById },
    create: { memberId, tagId, assignedById }
  });
}

async function upsertHelpRequest(input: {
  id: string;
  fromMemberId: string;
  toMemberId: string;
  title: string;
  message: string;
  category?: string;
  priority?: HelpRequestPriority;
  status?: HelpRequestStatus;
  responseMessage?: string;
}) {
  return prisma.memberHelpRequest.upsert({
    where: { id: input.id },
    update: {
      title: input.title,
      message: input.message,
      category: input.category,
      priority: input.priority ?? HelpRequestPriority.NORMAL,
      status: input.status ?? HelpRequestStatus.PENDING,
      responseMessage: input.responseMessage,
      respondedAt: input.responseMessage ? new Date() : undefined
    },
    create: {
      ...input,
      priority: input.priority ?? HelpRequestPriority.NORMAL,
      status: input.status ?? HelpRequestStatus.PENDING,
      respondedAt: input.responseMessage ? new Date() : undefined
    }
  });
}

async function upsertElection(input: {
  id: string;
  title: string;
  description?: string;
  positionTitle?: string;
  status?: ElectionStatus;
  resultStatus?: ElectionResultStatus;
  nominationStartAt: Date;
  nominationEndAt: Date;
  approvalDeadlineAt?: Date;
  candidatesAnnouncedAt?: Date;
  votingStartAt: Date;
  votingEndAt: Date;
  resultAnnouncedAt?: Date;
  ceremonyAt?: Date;
  createdById: string;
}) {
  const election = await prisma.election.upsert({
    where: { id: input.id },
    update: {
      title: input.title,
      description: input.description,
      positionTitle: input.positionTitle ?? "President",
      status: input.status ?? ElectionStatus.ANNOUNCED,
      resultStatus: input.resultStatus ?? ElectionResultStatus.NOT_READY,
      nominationStartAt: input.nominationStartAt,
      nominationEndAt: input.nominationEndAt,
      approvalDeadlineAt: input.approvalDeadlineAt,
      candidatesAnnouncedAt: input.candidatesAnnouncedAt,
      votingStartAt: input.votingStartAt,
      votingEndAt: input.votingEndAt,
      resultAnnouncedAt: input.resultAnnouncedAt,
      ceremonyAt: input.ceremonyAt,
      isPublished: true
    },
    create: {
      ...input,
      positionTitle: input.positionTitle ?? "President",
      status: input.status ?? ElectionStatus.ANNOUNCED,
      resultStatus: input.resultStatus ?? ElectionResultStatus.NOT_READY,
      isPublished: true
    }
  });
  return election;
}

async function upsertElectionVoter(electionId: string, memberId: string) {
  return prisma.electionVoter.upsert({
    where: { electionId_memberId: { electionId, memberId } },
    update: {},
    create: { electionId, memberId }
  });
}

async function upsertElectionNomination(input: {
  electionId: string;
  memberId: string;
  statement: string;
  slogan?: string;
  manifesto?: string;
  goals?: string;
  status?: NominationStatus;
}) {
  return prisma.electionNomination.upsert({
    where: { electionId_memberId: { electionId: input.electionId, memberId: input.memberId } },
    update: input,
    create: input
  });
}

async function main() {
  const superAdminUsername = process.env.SEED_SUPER_ADMIN_USERNAME ?? "admin";
  const superAdminPassword =
    process.env.SEED_SUPER_ADMIN_PASSWORD ?? "change-me";

  const superAdmin = await upsertMember({
    id: "seed-super-admin-member",
    fullName: "Super Admin",
    initials: "SA",
    gender: MemberGender.MALE,
    city: "Lahore"
  });

  await upsertUserAccount({
    memberId: superAdmin.id,
    username: superAdminUsername,
    password: superAdminPassword,
    role: UserRole.SUPER_ADMIN
  });
  await upsertNotificationPreference(superAdmin.id);

  const hajiAli = await upsertMember({
    id: "seed-haji-muhammad-ali",
    fullName: "Haji Muhammad Ali",
    initials: "HMA",
    gender: MemberGender.MALE,
    isFamilyHead: true,
    city: "Lahore",
    branchLabel: "Haji Ali branch"
  });

  const tariq = await upsertMember({
    id: "seed-tariq-tiwana",
    fullName: "Tariq Tiwana",
    initials: "TT",
    gender: MemberGender.MALE,
    city: "Lahore",
    branchLabel: "Haji Ali branch"
  });

  const arslan = await upsertMember({
    id: "seed-muhammad-arslan",
    fullName: "Muhammad Arslan",
    initials: "MA",
    gender: MemberGender.MALE,
    city: "Lahore",
    phone: "+920000000001",
    profession: "Software Engineer",
    branchLabel: "Haji Ali branch"
  });

  const ahmed = await upsertMember({
    id: "seed-ahmed-tiwana",
    fullName: "Ahmed Tiwana",
    initials: "AT",
    gender: MemberGender.MALE,
    branchLabel: "Haji Ali branch"
  });

  await upsertMember({
    id: "seed-usman-tiwana",
    fullName: "Usman Tiwana",
    initials: "UT",
    gender: MemberGender.MALE,
    branchLabel: "Haji Ali branch"
  });

  const akram = await upsertMember({
    id: "seed-akram-tiwana",
    fullName: "Akram Tiwana",
    initials: "AT",
    gender: MemberGender.MALE,
    branchLabel: "Haji Ali branch"
  });

  const usmanCousin = await upsertMember({
    id: "seed-usman-cousin-tiwana",
    fullName: "Usman Tiwana",
    initials: "UT",
    gender: MemberGender.MALE,
    branchLabel: "Haji Ali branch"
  });

  await upsertMember({
    id: "seed-hassan-tiwana",
    fullName: "Hassan Tiwana",
    initials: "HT",
    gender: MemberGender.MALE,
    branchLabel: "Haji Ali branch"
  });

  const privateFemale = await upsertMember({
    id: "seed-daughter-of-haji-ali",
    fullName: "Daughter of Haji Ali",
    alias: "Daughter of Haji Ali",
    initials: "DH",
    gender: MemberGender.FEMALE,
    visibility: VisibilityStatus.HIDDEN,
    branchLabel: "Haji Ali branch"
  });

  await upsertUserAccount({
    memberId: arslan.id,
    username: "arslan",
    password: "TC-84921",
    role: UserRole.MEMBER
  });
  await upsertNotificationPreference(arslan.id);

  await upsertRelationship({
    fromMemberId: hajiAli.id,
    toMemberId: tariq.id,
    type: FamilyRelationshipType.FATHER
  });
  await upsertRelationship({
    fromMemberId: tariq.id,
    toMemberId: hajiAli.id,
    type: FamilyRelationshipType.CHILD
  });
  await upsertRelationship({
    fromMemberId: hajiAli.id,
    toMemberId: akram.id,
    type: FamilyRelationshipType.FATHER
  });
  await upsertRelationship({
    fromMemberId: akram.id,
    toMemberId: hajiAli.id,
    type: FamilyRelationshipType.CHILD
  });
  await upsertRelationship({
    fromMemberId: tariq.id,
    toMemberId: arslan.id,
    type: FamilyRelationshipType.FATHER
  });
  await upsertRelationship({
    fromMemberId: arslan.id,
    toMemberId: tariq.id,
    type: FamilyRelationshipType.CHILD
  });
  await upsertRelationship({
    fromMemberId: privateFemale.id,
    toMemberId: arslan.id,
    type: FamilyRelationshipType.MOTHER
  });
  await upsertRelationship({
    fromMemberId: arslan.id,
    toMemberId: privateFemale.id,
    type: FamilyRelationshipType.CHILD
  });
  await upsertRelationship({
    fromMemberId: tariq.id,
    toMemberId: privateFemale.id,
    type: FamilyRelationshipType.SPOUSE
  });
  await upsertRelationship({
    fromMemberId: privateFemale.id,
    toMemberId: tariq.id,
    type: FamilyRelationshipType.SPOUSE
  });
  await upsertRelationship({
    fromMemberId: tariq.id,
    toMemberId: ahmed.id,
    type: FamilyRelationshipType.FATHER
  });
  await upsertRelationship({
    fromMemberId: privateFemale.id,
    toMemberId: ahmed.id,
    type: FamilyRelationshipType.MOTHER
  });
  await upsertRelationship({
    fromMemberId: akram.id,
    toMemberId: usmanCousin.id,
    type: FamilyRelationshipType.FATHER
  });

  const now = new Date();
  const officialMeeting = await upsertEvent({
    id: "seed-official-family-meeting",
    title: "Official Family Meeting",
    type: "OFFICIAL_MEETING",
    visibility: "ALL_FAMILY",
    isOfficial: true,
    isPinned: true,
    startAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
    locationName: "Community Hall",
    createdById: superAdmin.id
  });
  const eidGathering = await upsertEvent({
    id: "seed-family-eid-gathering",
    title: "Family Eid Gathering",
    type: "EID_GATHERING",
    visibility: "ALL_FAMILY",
    isOfficial: true,
    startAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 21),
    locationName: "Tiwana House",
    createdById: superAdmin.id
  });
  const cousinMeetup = await upsertEvent({
    id: "seed-cousin-meetup",
    title: "Cousin Meetup",
    type: "REUNION",
    visibility: "INVITED_ONLY",
    startAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14),
    locationName: "Lahore",
    createdById: arslan.id
  });
  await upsertEvent({
    id: "seed-past-family-event",
    title: "Past Family Dinner",
    status: "COMPLETED",
    startAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 30),
    locationName: "Lahore",
    createdById: tariq.id
  });
  await upsertEvent({
    id: "seed-cancelled-event",
    title: "Cancelled Planning Session",
    status: "CANCELLED",
    startAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10),
    locationName: "Online",
    createdById: superAdmin.id
  });

  for (const event of [officialMeeting, eidGathering, cousinMeetup]) {
    await upsertInvite({ eventId: event.id, memberId: arslan.id, invitedById: superAdmin.id, rsvpStatus: RSVPStatus.GOING });
    await upsertInvite({ eventId: event.id, memberId: ahmed.id, invitedById: superAdmin.id, rsvpStatus: RSVPStatus.MAYBE });
    await upsertInvite({ eventId: event.id, memberId: usmanCousin.id, invitedById: superAdmin.id, rsvpStatus: RSVPStatus.PENDING });
    await upsertInvite({ eventId: event.id, memberId: tariq.id, invitedById: superAdmin.id, rsvpStatus: RSVPStatus.GOING });
  }

  const generalFund = await upsertFund({
    id: "seed-family-general-fund",
    title: "Family General Fund",
    description: "Shared family operating fund for community needs.",
    type: FundType.FAMILY_GENERAL,
    targetAmount: "250000",
    isOfficial: true,
    isPinned: true,
    createdById: superAdmin.id
  });
  const zakatFund = await upsertFund({
    id: "seed-ramadan-zakat-fund",
    title: "Ramadan Zakat Fund",
    description: "Zakat ledger for Ramadan collections and disbursements.",
    type: FundType.FAMILY_GENERAL,
    targetAmount: "500000",
    isOfficial: true,
    createdById: superAdmin.id
  });
  const eidFund = await upsertFund({
    id: "seed-eid-gathering-fund",
    title: "Eid Gathering Fund",
    description: "Event-specific contributions for the Eid gathering.",
    type: FundType.FAMILY_GENERAL,
    targetAmount: "150000",
    isOfficial: true,
    createdById: superAdmin.id,
    relatedEventId: eidGathering.id
  });

  const arslanGeneralRequest = await upsertContributionRequest({
    fundId: generalFund.id,
    memberId: arslan.id,
    requestedAmount: "10000",
    paidAmount: "5000",
    status: "PARTIALLY_PAID",
    requestedById: superAdmin.id,
    note: "Monthly family contribution."
  });
  await upsertContributionRequest({
    fundId: generalFund.id,
    memberId: tariq.id,
    requestedAmount: "15000",
    paidAmount: "15000",
    status: "PAID",
    requestedById: superAdmin.id
  });
  await upsertContributionRequest({
    fundId: eidFund.id,
    memberId: ahmed.id,
    requestedAmount: "7500",
    status: "PENDING",
    requestedById: superAdmin.id,
    note: "Event catering share."
  });

  await upsertFundTransaction({
    id: "seed-general-arslan-contribution",
    fundId: generalFund.id,
    type: FundTransactionType.CONTRIBUTION,
    amount: "5000",
    contributorId: arslan.id,
    paymentMethod: FundPaymentMethod.CASH,
    recordedById: superAdmin.id,
    requestId: arslanGeneralRequest.id
  });
  await upsertFundTransaction({
    id: "seed-general-tariq-contribution",
    fundId: generalFund.id,
    type: FundTransactionType.CONTRIBUTION,
    amount: "15000",
    contributorId: tariq.id,
    paymentMethod: FundPaymentMethod.BANK_TRANSFER,
    referenceNumber: "SEED-BANK-001",
    recordedById: superAdmin.id
  });
  await upsertFundTransaction({
    id: "seed-general-community-expense",
    fundId: generalFund.id,
    type: FundTransactionType.EXPENSE,
    amount: "3500",
    note: "Community hall supplies.",
    recordedById: superAdmin.id
  });
  await upsertFundTransaction({
    id: "seed-zakat-income",
    fundId: zakatFund.id,
    type: FundTransactionType.ZAKAT_INCOME,
    amount: "50000",
    contributorId: hajiAli.id,
    paymentMethod: FundPaymentMethod.BANK_TRANSFER,
    recordedById: superAdmin.id
  });
  await upsertFundTransaction({
    id: "seed-zakat-disbursement",
    fundId: zakatFund.id,
    type: FundTransactionType.DISBURSEMENT,
    amount: "12000",
    recipientMemberId: usmanCousin.id,
    note: "Approved family help disbursement.",
    recordedById: superAdmin.id
  });

  const directoryTags = await Promise.all([
    upsertTag({ name: "Doctor", type: MemberTagType.PROFESSION }),
    upsertTag({ name: "Software Engineer", type: MemberTagType.PROFESSION }),
    upsertTag({ name: "Business Owner", type: MemberTagType.PROFESSION }),
    upsertTag({ name: "Teacher", type: MemberTagType.PROFESSION }),
    upsertTag({ name: "Lawyer", type: MemberTagType.PROFESSION }),
    upsertTag({ name: "IT Support", type: MemberTagType.SERVICE }),
    upsertTag({ name: "Medical Help", type: MemberTagType.SERVICE }),
    upsertTag({ name: "Event Management", type: MemberTagType.SKILL }),
    upsertTag({ name: "Rawalpindi", type: MemberTagType.CITY }),
    upsertTag({ name: "Lahore", type: MemberTagType.CITY }),
    upsertTag({ name: "Islamabad", type: MemberTagType.CITY })
  ]);
  const tagByName = new Map(directoryTags.map((tag) => [tag.name, tag]));

  await upsertDirectorySetting({
    memberId: arslan.id,
    showPhone: true,
    bio: "Available for IT support and family platform help.",
    availabilityNote: "Evenings and weekends."
  });
  await upsertDirectorySetting({
    memberId: ahmed.id,
    bio: "Can help coordinate family events.",
    availabilityNote: "Best contacted before events."
  });
  await upsertDirectorySetting({
    memberId: tariq.id,
    showPhone: true,
    bio: "Available for family fund guidance and branch coordination."
  });

  await assignTag(arslan.id, tagByName.get("Software Engineer")!.id, superAdmin.id);
  await assignTag(arslan.id, tagByName.get("IT Support")!.id, superAdmin.id);
  await assignTag(arslan.id, tagByName.get("Lahore")!.id, superAdmin.id);
  await assignTag(ahmed.id, tagByName.get("Event Management")!.id, superAdmin.id);
  await assignTag(tariq.id, tagByName.get("Business Owner")!.id, superAdmin.id);
  await assignTag(tariq.id, tagByName.get("Lahore")!.id, superAdmin.id);

  await upsertHelpRequest({
    id: "seed-help-arslan-ahmed-event",
    fromMemberId: arslan.id,
    toMemberId: ahmed.id,
    title: "Need help with event coordination",
    message: "Can you help coordinate seating for the next family event?",
    category: "Event Management",
    priority: HelpRequestPriority.NORMAL
  });
  await upsertHelpRequest({
    id: "seed-help-ahmed-tariq-fund",
    fromMemberId: ahmed.id,
    toMemberId: tariq.id,
    title: "Family fund guidance",
    message: "I need guidance on recording a family contribution.",
    category: "Funds",
    priority: HelpRequestPriority.HIGH,
    status: HelpRequestStatus.ACCEPTED,
    responseMessage: "Sure, I can help after Maghrib."
  });
  await upsertHelpRequest({
    id: "seed-help-usman-arslan-it",
    fromMemberId: usmanCousin.id,
    toMemberId: arslan.id,
    title: "IT support",
    message: "Please help me with my mobile login.",
    category: "IT Support",
    priority: HelpRequestPriority.NORMAL
  });

  const election = await upsertElection({
    id: "seed-president-election-2026",
    title: "President Election 2026",
    description: "Family president election with nominations, confidential voting, and authorization ceremony.",
    nominationStartAt: new Date(now.getTime() - 1000 * 60 * 60 * 24 * 5),
    nominationEndAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 2),
    approvalDeadlineAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 3),
    candidatesAnnouncedAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 4),
    votingStartAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 5),
    votingEndAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 7),
    resultAnnouncedAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 8),
    ceremonyAt: new Date(now.getTime() + 1000 * 60 * 60 * 24 * 10),
    createdById: superAdmin.id
  });

  for (const member of [superAdmin, hajiAli, tariq, arslan, ahmed, akram, usmanCousin]) {
    await upsertElectionVoter(election.id, member.id);
  }
  const arslanNomination = await upsertElectionNomination({
    electionId: election.id,
    memberId: arslan.id,
    statement: "I will improve family digital coordination and member support.",
    slogan: "Connected family, stronger future.",
    manifesto: "Focus on communication, transparency, and service.",
    goals: "Improve member onboarding, events, funds visibility, and help requests.",
    status: NominationStatus.APPROVED
  });
  const tariqNomination = await upsertElectionNomination({
    electionId: election.id,
    memberId: tariq.id,
    statement: "I will strengthen branch coordination and family unity.",
    slogan: "Unity with responsibility.",
    status: NominationStatus.APPROVED
  });
  await upsertElectionNomination({
    electionId: election.id,
    memberId: ahmed.id,
    statement: "I can help organize events and younger member engagement.",
    slogan: "Participation for everyone.",
    status: NominationStatus.PENDING
  });
  for (const nomination of [arslanNomination, tariqNomination]) {
    await prisma.electionCandidate.upsert({
      where: { electionId_memberId: { electionId: election.id, memberId: nomination.memberId } },
      update: {
        nominationId: nomination.id,
        status: CandidateStatus.ANNOUNCED,
        statement: nomination.statement,
        manifesto: nomination.manifesto,
        goals: nomination.goals,
        slogan: nomination.slogan
      },
      create: {
        electionId: election.id,
        nominationId: nomination.id,
        memberId: nomination.memberId,
        status: CandidateStatus.ANNOUNCED,
        statement: nomination.statement,
        manifesto: nomination.manifesto,
        goals: nomination.goals,
        slogan: nomination.slogan
      }
    });
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
