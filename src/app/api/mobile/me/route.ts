import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { toMobileSafeMember } from "@/lib/privacy/member-display";

export const runtime = "nodejs";

export const GET = withApiHandler(async (request) => {
  const session = await requireSession(request);
  const account = await prisma.userAccount.findUniqueOrThrow({
    where: { id: session.userId },
    include: { member: true }
  });

  return apiSuccess({
    user: {
      id: account.id,
      memberId: account.memberId,
      username: account.username,
      role: account.role,
      mustChangePassword: account.mustChangePassword
    },
    member: toMobileSafeMember(account.member, { role: account.role })
  });
});
