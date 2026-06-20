import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { requireSuperAdminSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
type Context = { params: Promise<{ id: string }> };

export const GET = withApiHandler(async (request, context) => {
  await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  return apiSuccess({ phases: await prisma.electionPhase.findMany({ where: { electionId: id }, orderBy: { createdAt: "asc" } }) });
});

export const PATCH = withApiHandler(async (request, context) => {
  await requireSuperAdminSession(request);
  const { id } = await (context as Context).params;
  const body = await request.json();
  return apiSuccess(await prisma.election.update({ where: { id }, data: body }));
});
