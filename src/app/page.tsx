import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <section className="w-full max-w-xl rounded-lg border bg-card p-8 shadow-sm">
        <p className="text-sm font-medium text-primary">Tiwana Connect</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight">
          Backend and admin foundation
        </h1>
        <p className="mt-3 text-muted-foreground">
          Phase 0 is ready for the private family platform admin panel and API
          foundation.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Go to login
          </Link>
        </div>
      </section>
    </main>
  );
}
