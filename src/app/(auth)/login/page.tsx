import { LoginForm } from "@/components/admin/login-form";

export default function LoginPage() {
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
