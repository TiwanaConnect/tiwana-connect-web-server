import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/admin/login-form";
import { getCurrentSessionFromTokens } from "@/lib/auth/session";

export default async function LoginPage() {
  const cookieStore = await cookies();
  const session = await getCurrentSessionFromTokens({
    accessToken: cookieStore.get("tc_access_token")?.value ?? null,
    refreshToken: cookieStore.get("tc_refresh_token")?.value ?? null
  });

  if (session?.role === "SUPER_ADMIN") {
    redirect("/admin");
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-md rounded-lg border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-primary">Secure admin access</p>
        <h1 className="mt-3 text-2xl font-semibold">Admin login</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Sign in with a generated Tiwana Connect account.
        </p>
        <LoginForm />
      </section>
    </main>
  );
}
