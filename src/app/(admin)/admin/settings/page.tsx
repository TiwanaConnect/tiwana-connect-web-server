import { LogoutButton } from "@/components/admin/logout-button";

export default function SettingsPage() {
  return (
    <div className="max-w-xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Account actions for the current admin session.
        </p>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h2 className="text-base font-semibold">Session</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Logout clears your admin session on this device.
        </p>
        <div className="mt-4">
          <LogoutButton />
        </div>
      </section>
    </div>
  );
}
