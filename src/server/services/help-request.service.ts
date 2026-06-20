import type { HelpRequestPriority, HelpRequestStatus, Prisma, UserRole } from "@prisma/client";

import { API_ERROR_CODES, AppError } from "@/lib/api/errors";
import { prisma } from "@/lib/db/prisma";
import { toAdminHelpRequestDto, toMobileHelpRequestDto } from "@/server/dto/directory.dto";
import { findHelpRequestById, findHelpRequests } from "@/server/repositories/help-request.repository";
import { notifyMembers } from "@/server/services/notification.service";

import { recordAuditLog } from "./audit.service";

function parseDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "Invalid date.", 400);
  return date;
}

export async function listHelpRequests(input: {
  viewerMemberId?: string;
  viewerRole: UserRole;
  direction?: "sent" | "received";
  admin?: boolean;
  q?: string;
  status?: HelpRequestStatus;
  priority?: HelpRequestPriority;
  category?: string;
  memberId?: string;
  fromMemberId?: string;
  toMemberId?: string;
  fromDate?: string;
  toDate?: string;
  limit: number;
  cursor?: string;
}) {
  const where: Prisma.MemberHelpRequestWhereInput = {
    deletedAt: null,
    ...(input.admin
      ? {
          ...(input.memberId ? { OR: [{ fromMemberId: input.memberId }, { toMemberId: input.memberId }] } : {}),
          ...(input.fromMemberId ? { fromMemberId: input.fromMemberId } : {}),
          ...(input.toMemberId ? { toMemberId: input.toMemberId } : {})
        }
      : input.direction === "sent"
        ? { fromMemberId: input.viewerMemberId }
        : { toMemberId: input.viewerMemberId }),
    ...(input.q ? { OR: [{ title: { contains: input.q, mode: "insensitive" } }, { message: { contains: input.q, mode: "insensitive" } }] } : {}),
    ...(input.status ? { status: input.status } : {}),
    ...(input.priority ? { priority: input.priority } : {}),
    ...(input.category ? { category: { contains: input.category, mode: "insensitive" } } : {}),
    ...(input.fromDate || input.toDate
      ? { createdAt: { ...(input.fromDate ? { gte: parseDate(input.fromDate) } : {}), ...(input.toDate ? { lte: parseDate(input.toDate) } : {}) } }
      : {})
  };
  const requests = await findHelpRequests({
    where,
    orderBy: { createdAt: "desc" },
    ...(input.cursor ? { cursor: { id: input.cursor }, skip: 1 } : {}),
    take: input.limit + 1
  });
  return {
    requests: requests
      .slice(0, input.limit)
      .map((request) => input.admin ? toAdminHelpRequestDto(request) : toMobileHelpRequestDto(request, input.viewerRole)),
    nextCursor: requests.length > input.limit ? requests[input.limit]?.id ?? null : null
  };
}

export async function getHelpRequest(input: { id: string; viewerMemberId: string; viewerRole: UserRole; admin?: boolean }) {
  const request = await findHelpRequestById(input.id);
  if (!request || request.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Help request not found.", 404);
  if (!input.admin && request.fromMemberId !== input.viewerMemberId && request.toMemberId !== input.viewerMemberId) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "You cannot view this help request.", 403);
  }
  return { request: input.admin ? toAdminHelpRequestDto(request) : toMobileHelpRequestDto(request, input.viewerRole) };
}

export async function sendHelpRequest(input: {
  fromMemberId: string;
  toMemberId: string;
  title: string;
  message: string;
  category?: string | null;
  priority: HelpRequestPriority;
}) {
  if (input.fromMemberId === input.toMemberId) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "You cannot send a help request to yourself.", 400);
  }
  const target = await prisma.member.findUnique({
    where: { id: input.toMemberId },
    include: { directorySetting: true }
  });
  if (!target || target.deletedAt || target.status !== "ACTIVE") {
    throw new AppError(API_ERROR_CODES.NOT_FOUND, "Target member not found.", 404);
  }
  if (target.directorySetting?.allowHelpRequests === false) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "This member is not accepting help requests.", 403);
  }

  const request = await prisma.memberHelpRequest.create({
    data: {
      fromMemberId: input.fromMemberId,
      toMemberId: input.toMemberId,
      title: input.title,
      message: input.message,
      category: input.category,
      priority: input.priority
    },
    include: { fromMember: true, toMember: true }
  });
  await recordAuditLog({ actorMemberId: input.fromMemberId, action: "help_request_sent", entityType: "HELP_REQUEST", entityId: request.id });
  await notifyMembers({
    memberIds: [request.toMemberId],
    type: "HELP_REQUEST",
    title: "New help request",
    body: "A family member sent you a help request.",
    entityType: "HELP_REQUEST",
    entityId: request.id,
    actionLabel: "View request",
    actionUrl: `/help-requests/${request.id}`,
    priority: request.priority === "URGENT" || request.priority === "HIGH" ? "HIGH" : "NORMAL",
    push: true
  });
  return { request: toMobileHelpRequestDto(request, "MEMBER") };
}

export async function respondHelpRequest(input: {
  requestId: string;
  actorMemberId: string;
  actorRole: UserRole;
  status: Extract<HelpRequestStatus, "ACCEPTED" | "DECLINED">;
  responseMessage?: string | null;
}) {
  const existing = await findHelpRequestById(input.requestId);
  if (!existing || existing.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Help request not found.", 404);
  if (existing.toMemberId !== input.actorMemberId) throw new AppError(API_ERROR_CODES.FORBIDDEN, "Only the receiver can respond.", 403);
  const request = await prisma.memberHelpRequest.update({
    where: { id: input.requestId },
    data: { status: input.status, responseMessage: input.responseMessage, respondedAt: new Date() },
    include: { fromMember: true, toMember: true }
  });
  await recordAuditLog({ actorMemberId: input.actorMemberId, action: `help_request_${input.status.toLowerCase()}`, entityType: "HELP_REQUEST", entityId: request.id });
  await notifyMembers({
    memberIds: [request.fromMemberId],
    type: "HELP_REQUEST_RESPONSE",
    title: input.status === "ACCEPTED" ? "Help request accepted" : "Help request declined",
    body: "A family member responded to your help request.",
    entityType: "HELP_REQUEST",
    entityId: request.id,
    actionLabel: "View request",
    actionUrl: `/help-requests/${request.id}`,
    priority: input.status === "ACCEPTED" ? "NORMAL" : "HIGH",
    push: true
  });
  return { request: toMobileHelpRequestDto(request, input.actorRole) };
}

export async function completeHelpRequest(input: { requestId: string; actorMemberId: string; actorRole: UserRole }) {
  const existing = await findHelpRequestById(input.requestId);
  if (!existing || existing.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Help request not found.", 404);
  if (existing.fromMemberId !== input.actorMemberId && existing.toMemberId !== input.actorMemberId) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Only request participants can complete it.", 403);
  }
  const request = await prisma.memberHelpRequest.update({
    where: { id: input.requestId },
    data: { status: "COMPLETED", completedAt: new Date() },
    include: { fromMember: true, toMember: true }
  });
  await recordAuditLog({ actorMemberId: input.actorMemberId, action: "help_request_completed", entityType: "HELP_REQUEST", entityId: request.id });
  await notifyMembers({
    memberIds: [request.fromMemberId, request.toMemberId].filter((memberId) => memberId !== input.actorMemberId),
    type: "HELP_REQUEST_RESPONSE",
    title: "Help request completed",
    body: "A help request was marked complete.",
    entityType: "HELP_REQUEST",
    entityId: request.id,
    actionLabel: "View request",
    actionUrl: `/help-requests/${request.id}`,
    priority: "NORMAL",
    push: true
  });
  return { request: toMobileHelpRequestDto(request, input.actorRole) };
}

export async function cancelHelpRequest(input: { requestId: string; actorMemberId: string; actorRole?: UserRole; admin?: boolean }) {
  const existing = await findHelpRequestById(input.requestId);
  if (!existing || existing.deletedAt) throw new AppError(API_ERROR_CODES.NOT_FOUND, "Help request not found.", 404);
  if (!input.admin && existing.fromMemberId !== input.actorMemberId) {
    throw new AppError(API_ERROR_CODES.FORBIDDEN, "Only the sender can cancel this request.", 403);
  }
  if (!input.admin && !["PENDING", "ACCEPTED"].includes(existing.status)) {
    throw new AppError(API_ERROR_CODES.VALIDATION_ERROR, "This request can no longer be cancelled.", 400);
  }
  const request = await prisma.memberHelpRequest.update({
    where: { id: input.requestId },
    data: { status: "CANCELLED", cancelledAt: new Date() },
    include: { fromMember: true, toMember: true }
  });
  await recordAuditLog({ actorMemberId: input.actorMemberId, action: input.admin ? "admin_help_request_cancelled" : "help_request_cancelled", entityType: "HELP_REQUEST", entityId: request.id });
  return { request: input.admin ? toAdminHelpRequestDto(request) : toMobileHelpRequestDto(request, input.actorRole ?? "MEMBER") };
}

export async function updateHelpRequest(input: {
  requestId: string;
  actorMemberId: string;
  status?: HelpRequestStatus;
  priority?: HelpRequestPriority;
  category?: string | null;
  responseMessage?: string | null;
}) {
  const request = await prisma.memberHelpRequest.update({
    where: { id: input.requestId },
    data: {
      status: input.status,
      priority: input.priority,
      category: input.category,
      responseMessage: input.responseMessage,
      respondedAt: input.status === "ACCEPTED" || input.status === "DECLINED" ? new Date() : undefined,
      completedAt: input.status === "COMPLETED" ? new Date() : undefined,
      cancelledAt: input.status === "CANCELLED" ? new Date() : undefined
    },
    include: { fromMember: true, toMember: true }
  });
  await recordAuditLog({ actorMemberId: input.actorMemberId, action: "admin_help_request_updated", entityType: "HELP_REQUEST", entityId: request.id });
  return { request: toAdminHelpRequestDto(request) };
}
