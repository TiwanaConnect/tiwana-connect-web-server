import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { parseOrThrow } from "@/lib/api/validation";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { memberSearchQuerySchema } from "@/lib/validators/family-tree.validators";
import { toMemberNode } from "@/server/services/member-privacy.service";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const query = parseOrThrow(
    memberSearchQuerySchema,
    Object.fromEntries(request.nextUrl.searchParams.entries())
  );

  const members = await prisma.member.findMany({
    where: {
      deletedAt: null,
      status: "ACTIVE",
      NOT: {
        gender: "FEMALE",
        visibility: "HIDDEN"
      },
      ...(query.cursor ? { id: { gt: query.cursor } } : {}),
      ...(query.q
        ? {
            OR: [
              { fullName: { contains: query.q, mode: "insensitive" } },
              { alias: { contains: query.q, mode: "insensitive" } },
              { city: { contains: query.q, mode: "insensitive" } },
              { profession: { contains: query.q, mode: "insensitive" } }
            ]
          }
        : {})
    },
    include: { userAccount: true },
    orderBy: { id: "asc" },
    take: query.limit + 1
  });
  const page = members.slice(0, query.limit);
  const nextCursor =
    members.length > query.limit ? members[query.limit]?.id : null;

  return apiSuccess({
    members: page.map((member) =>
      toMemberNode({
        member,
        viewerRole: session.role,
        currentUserId: session.memberId,
        relationshipLabel: "Relative",
        includeHiddenNames: false
      })
    ),
    nextCursor
  });
});
