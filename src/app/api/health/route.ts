import { prisma } from "@/lib/db/prisma";
import { apiSuccess } from "@/lib/api/response";
import { withApiHandler } from "@/lib/api/route-handler";
import { API_SERVICE_NAME } from "@/config/constants";

export const runtime = "nodejs";

export const GET = withApiHandler(async () => {
  await prisma.$queryRaw`SELECT 1`;

  return apiSuccess({
    ok: true,
    service: API_SERVICE_NAME,
    timestamp: new Date().toISOString()
  });
});
