"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";

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
  const queryClient = useQueryClient();
  const toast = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const actionMutation = useMutation({
    mutationFn: ({ path, body }: { path: string; body?: unknown }) =>
      apiRequest<{ username?: string; temporaryPassword?: string } | null>(path, {
        method: "POST",
        body: body ? JSON.stringify(body) : undefined
      }),
    onSuccess: (data) => {
      const successMessage = data?.temporaryPassword
        ? `Temporary password for ${data.username}: ${data.temporaryPassword}`
        : "Updated.";
      setMessage(successMessage);
      toast.success("Member updated", data?.temporaryPassword ? "Temporary password generated." : undefined);
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      router.refresh();
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Request failed.";
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  });
  const deleteMutation = useMutation({
    mutationFn: () => apiRequest<{ ok: true } | null>(`/api/admin/members/${memberId}`, { method: "DELETE" }),
    onSuccess: () => {
      toast.success("Member deleted");
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "family-tree"] });
      router.replace("/admin/members");
      router.refresh();
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : "Delete failed.");
    }
  });

  function post(path: string, body?: unknown) {
    setMessage(null);
    actionMutation.mutate({ path, body });
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
        <button className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-700" onClick={() => setDeleteOpen(true)}>
          Delete Member
        </button>
      </div>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {deleteOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-lg">
            <h2 className="text-lg font-semibold">Delete member?</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              This will remove the member from normal admin views. Use this only when a member was added by accident.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button className="rounded-md border px-4 py-2 text-sm" onClick={() => setDeleteOpen(false)}>
                Cancel
              </button>
              <button
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
