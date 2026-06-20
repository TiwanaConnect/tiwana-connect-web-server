"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function MemberActions({
  memberId,
  hasLogin,
  isLoginActive,
  status
}: {
  memberId: string;
  hasLogin: boolean;
  isLoginActive: boolean;
  status: string;
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);

  async function post(path: string, body?: unknown) {
    setMessage(null);
    const response = await fetch(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: body ? JSON.stringify(body) : undefined
    });
    const json = await response.json();

    if (!response.ok) {
      setMessage(json.error?.message ?? "Request failed.");
      return;
    }

    if (json.data?.temporaryPassword) {
      setMessage(
        `Temporary password for ${json.data.username}: ${json.data.temporaryPassword}`
      );
    } else {
      setMessage("Updated.");
    }

    router.refresh();
  }

  const username = `member-${memberId.slice(0, 6)}`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {!hasLogin ? (
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => post(`/api/admin/members/${memberId}/generate-login`, { username, role: "MEMBER" })}>
            Generate Login
          </button>
        ) : (
          <>
            <button className="rounded-md border px-3 py-2 text-sm" onClick={() => post(`/api/admin/members/${memberId}/reset-password`)}>
              Reset Password
            </button>
            <button className="rounded-md border px-3 py-2 text-sm" onClick={() => post(`/api/admin/members/${memberId}/${isLoginActive ? "disable-login" : "enable-login"}`)}>
              {isLoginActive ? "Disable Login" : "Enable Login"}
            </button>
          </>
        )}
        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => post(`/api/admin/members/${memberId}/${status === "BLOCKED" ? "unblock" : "block"}`)}>
          {status === "BLOCKED" ? "Unblock" : "Block"}
        </button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </div>
  );
}
