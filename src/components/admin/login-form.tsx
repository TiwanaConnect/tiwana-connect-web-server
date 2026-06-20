"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function LoginForm() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/admin/auth/login", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        username: data.get("username"),
        password: data.get("password")
      })
    });
    const json = await response.json();

    if (!response.ok) {
      setMessage(json.error?.message ?? "Login failed.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 space-y-4">
      <label className="block space-y-1 text-sm font-medium">
        Username
        <input name="username" className="w-full rounded-md border bg-background px-3 py-2" />
      </label>
      <label className="block space-y-1 text-sm font-medium">
        Password
        <input name="password" type="password" className="w-full rounded-md border bg-background px-3 py-2" />
      </label>
      <button className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
        Sign in
      </button>
      {message ? <p className="text-sm text-red-600">{message}</p> : null}
    </form>
  );
}
