import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AdminShell } from "@/components/admin/admin-shell";
import { getCurrentSessionFromTokens } from "@/lib/auth/session";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const session = await getCurrentSessionFromTokens({
    accessToken: cookieStore.get("tc_access_token")?.value ?? null,
    refreshToken: cookieStore.get("tc_refresh_token")?.value ?? null
  });

  if (!session || session.role !== "SUPER_ADMIN") {
    redirect("/login");
  }

  return <AdminShell>{children}</AdminShell>;
}
