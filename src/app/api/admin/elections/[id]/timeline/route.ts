import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const election = await prisma.election.findUnique({
    where: { id },
    select: {
      nominationStartAt: true,
      nominationEndAt: true,
      votingStartAt: true,
      votingEndAt: true
    }
  });
  return apiSuccess({ timeline: election });
});

export const PATCH = withApiHandler(async (request, context) => {
  await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = await request.json();
  return apiSuccess(await prisma.election.update({ where: { id }, data: body }));
});
