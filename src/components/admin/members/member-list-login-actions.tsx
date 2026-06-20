"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useToast } from "@/components/ui/toast";
import { apiRequest } from "@/lib/api/client";

type MemberListLoginActionsProps = {
  memberId: string;
  memberName: string;
  hasLogin: boolean;
  isLoginActive: boolean;
};

export function MemberListLoginActions({
  memberId,
  memberName,
  hasLogin,
  isLoginActive
}: MemberListLoginActionsProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [credentials, setCredentials] = useState<{
    username: string;
    temporaryPassword: string;
  } | null>(null);

  const mutation = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) =>
      apiRequest<{ username: string; temporaryPassword: string } | null>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      router.refresh();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Request failed.";
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  });

  async function post(path: string, body?: unknown) {
    setMessage(null);
    return mutation.mutateAsync({ path, body });
  }

  async function onGenerate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const autoGenerate = form.get("autoGenerate") === "on";
    const data = await post(`/api/admin/members/${memberId}/generate-login`, {
      username: String(form.get("username") ?? ""),
      role: String(form.get("role") ?? "MEMBER"),
      temporaryPassword: autoGenerate
        ? undefined
        : String(form.get("temporaryPassword") ?? "")
    });

    if (data) {
      setCredentials({
        username: data.username,
        temporaryPassword: data.temporaryPassword
      });
      setMessage("Login generated. Password is shown only once.");
      toast.success("Login generated", "Password is shown only once.");
    }
  }

  if (hasLogin) {
    return (
      <div className="flex flex-wrap gap-2">
        <button
          className="rounded-md border px-2 py-1 text-xs"
          onClick={async () => {
            const data = await post(`/api/admin/members/${memberId}/reset-password`);
            if (data?.temporaryPassword) {
              toast.success("Password reset", "Temporary password generated.");
            }
          }}
        >
          Reset Password
        </button>
        <button
          className="rounded-md border px-2 py-1 text-xs"
          onClick={() => {
            post(`/api/admin/members/${memberId}/${isLoginActive ? "disable-login" : "enable-login"}`).then(() => {
              toast.success(isLoginActive ? "Login disabled" : "Login enabled");
            });
          }}
        >
          {isLoginActive ? "Disable" : "Enable"}
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        className="rounded-md border px-2 py-1 text-xs font-medium text-primary"
        onClick={() => setOpen(true)}
      >
        Generate Login
      </button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-lg rounded-lg border bg-card p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">Generate Login</h2>
                <p className="text-sm text-muted-foreground">{memberName}</p>
              </div>
              <button className="text-sm text-muted-foreground" onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <form onSubmit={onGenerate} className="mt-5 space-y-4">
              <label className="block space-y-1 text-sm font-medium">
                Username
                <input
                  name="username"
                  required
                  defaultValue={memberName.toLowerCase().replace(/[^a-z0-9]+/g, ".").replace(/(^\.|\.$)/g, "")}
                  className="w-full rounded-md border bg-background px-3 py-2"
                />
              </label>
              <label className="block space-y-1 text-sm font-medium">
                Role
                <select name="role" defaultValue="MEMBER" className="w-full rounded-md border bg-background px-3 py-2">
                  <option value="MEMBER">Member</option>
                  <option value="PRESIDENT">President</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </label>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input name="autoGenerate" type="checkbox" defaultChecked />
                Auto-generate password
              </label>
              <label className="block space-y-1 text-sm font-medium">
                Custom temporary password
                <input name="temporaryPassword" className="w-full rounded-md border bg-background px-3 py-2" />
              </label>
              <button className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
                Generate
              </button>
            </form>
            {message ? <p className="mt-4 text-sm text-muted-foreground">{message}</p> : null}
            {credentials ? (
              <div className="mt-4 rounded-md border border-primary/30 bg-primary/10 p-4 text-sm">
                <p className="font-medium">Save these now. They are shown only once.</p>
                <div className="mt-3 grid gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <code>{credentials.username}</code>
                    <button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={() => navigator.clipboard.writeText(credentials.username)}>
                      Copy username
                    </button>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <code>{credentials.temporaryPassword}</code>
                    <button type="button" className="rounded-md border px-2 py-1 text-xs" onClick={() => navigator.clipboard.writeText(credentials.temporaryPassword)}>
                      Copy password
                    </button>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
