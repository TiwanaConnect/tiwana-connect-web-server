"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function logout() {
    setIsLoggingOut(true);
    setMessage(null);

    const response = await fetch("/api/admin/auth/logout", { method: "POST" });

    if (!response.ok) {
      setIsLoggingOut(false);
      setMessage("Logout failed. Please try again.");
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={logout}
        disabled={isLoggingOut}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoggingOut ? "Logging out..." : "Logout"}
      </button>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </div>
  );
}
