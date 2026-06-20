import { apiRequest } from "@/lib/api/client";

import type { AdminFamilyTreeChartResponse } from "../types";

export function getAdminFamilyTreeChart(includeDeactivated: boolean) {
  const params = new URLSearchParams();
  if (includeDeactivated) params.set("includeDeactivated", "true");
  const query = params.toString();
  return apiRequest<AdminFamilyTreeChartResponse>(
    `/api/admin/family-tree/chart${query ? `?${query}` : ""}`
  );
}
