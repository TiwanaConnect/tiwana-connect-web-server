"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { apiRequest } from "@/lib/api/client";
import { useToast } from "@/components/ui/toast";

type MemberFormProps = {
  mode: "create" | "edit";
  relationshipCandidates?: Array<{
    id: string;
    label: string;
    gender: string;
  }>;
  member?: {
    id: string;
    fullName: string | null;
    alias: string | null;
    gender: string;
    visibility: string;
    isFamilyHead: boolean;
    city: string | null;
    phone: string | null;
    profession: string | null;
    branchLabel: string | null;
    dateOfBirth: string | Date | null;
    notes: string | null;
  };
  currentRelationships?: {
    fatherMemberId?: string | null;
    motherMemberId?: string | null;
    spouseMemberIds?: string[];
  };
};

function getFormPayload(form: HTMLFormElement) {
  const data = new FormData(form);
  const spouseMemberIds = data.getAll("spouseMemberIds").map(String).filter(Boolean);

  return {
    fullName: String(data.get("fullName") ?? ""),
    alias: String(data.get("alias") ?? ""),
    gender: String(data.get("gender") ?? "MALE"),
    visibility: String(data.get("visibility") ?? "VISIBLE"),
    isFamilyHead: data.get("isFamilyHead") === "on",
    city: String(data.get("city") ?? ""),
    phone: String(data.get("phone") ?? ""),
    profession: String(data.get("profession") ?? ""),
    branchLabel: String(data.get("branchLabel") ?? ""),
    dateOfBirth: String(data.get("dateOfBirth") ?? ""),
    notes: String(data.get("notes") ?? ""),
    createLogin: data.get("createLogin") === "on",
    username: String(data.get("username") ?? ""),
    role: String(data.get("role") ?? "MEMBER"),
    relationships: {
      fatherMemberId: String(data.get("fatherMemberId") ?? ""),
      motherMemberId: String(data.get("motherMemberId") ?? ""),
      spouseMemberIds
    }
  };
}

export function MemberForm({
  mode,
  member,
  currentRelationships,
  relationshipCandidates = []
}: MemberFormProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const toast = useToast();
  const formRef = useRef<HTMLFormElement | null>(null);
  const [selectedGender, setSelectedGender] = useState(member?.gender ?? "MALE");
  const [message, setMessage] = useState<string | null>(null);
  const [credential, setCredential] = useState<{
    username: string;
    temporaryPassword: string;
  } | null>(null);
  const isEdit = mode === "edit" && member;
  const fatherCandidates = relationshipCandidates.filter((candidate) => candidate.gender === "MALE");
  const motherCandidates = relationshipCandidates.filter((candidate) => candidate.gender === "FEMALE");
  const spouseCandidates = relationshipCandidates.filter((candidate) => {
    return selectedGender === "MALE"
      ? candidate.gender === "FEMALE"
      : candidate.gender === "MALE";
  });
  const spouseLabel = selectedGender === "MALE" ? "Wife member" : "Husband member";
  const mutation = useMutation({
    mutationFn: (payload: ReturnType<typeof getFormPayload>) =>
      apiRequest<{
        generatedCredential?: { username: string; temporaryPassword: string } | null;
      } | null>(isEdit ? `/api/admin/members/${member.id}` : "/api/admin/members", {
        method: isEdit ? "PATCH" : "POST",
        body: JSON.stringify(isEdit ? { ...payload, createLogin: undefined } : payload)
      }),
    onSuccess: (data) => {
      const successMessage = isEdit ? "Member updated." : "Member created.";
      setMessage(successMessage);
      setCredential(data?.generatedCredential ?? null);
      toast.success(successMessage);
      queryClient.invalidateQueries({ queryKey: ["admin", "members"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "family-tree"] });
      router.refresh();

      if (!isEdit) {
        formRef.current?.reset();
        setSelectedGender("MALE");
      }
    },
    onError: (error) => {
      const errorMessage = error instanceof Error ? error.message : "Request failed.";
      setMessage(errorMessage);
      toast.error(errorMessage);
    }
  });

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setCredential(null);

    const payload = getFormPayload(event.currentTarget);
    mutation.mutate(payload);
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className="space-y-6 rounded-lg border bg-card p-6">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm font-medium">
          Full name
          <input name="fullName" defaultValue={member?.fullName ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Alias
          <input name="alias" defaultValue={member?.alias ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Gender
          <select
            name="gender"
            defaultValue={member?.gender ?? "MALE"}
            onChange={(event) => setSelectedGender(event.target.value)}
            className="w-full rounded-md border bg-background px-3 py-2"
          >
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          Visibility
          <select name="visibility" defaultValue={member?.visibility ?? "VISIBLE"} className="w-full rounded-md border bg-background px-3 py-2">
            <option value="VISIBLE">Visible</option>
            <option value="HIDDEN">Hidden</option>
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">
          City
          <input name="city" defaultValue={member?.city ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Phone
          <input name="phone" defaultValue={member?.phone ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Profession
          <input name="profession" defaultValue={member?.profession ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Branch label
          <input name="branchLabel" defaultValue={member?.branchLabel ?? ""} className="w-full rounded-md border bg-background px-3 py-2" />
        </label>
        <label className="space-y-1 text-sm font-medium">
          Date of birth
          <input
            name="dateOfBirth"
            type="date"
            defaultValue={
              member?.dateOfBirth
                ? new Date(member.dateOfBirth).toISOString().slice(0, 10)
                : ""
            }
            className="w-full rounded-md border bg-background px-3 py-2"
          />
        </label>
      </div>
      <label className="flex items-start gap-3 rounded-md border bg-muted/30 p-4 text-sm">
        <input
          name="isFamilyHead"
          type="checkbox"
          defaultChecked={member?.isFamilyHead ?? false}
          className="mt-1"
        />
        <span>
          <span className="block font-medium">Is Head of Family?</span>
          <span className="text-muted-foreground">
            Use this for admin filtering and future branch/tree grouping.
          </span>
        </span>
      </label>
      <label className="block space-y-1 text-sm font-medium">
        Notes
        <textarea name="notes" defaultValue={member?.notes ?? ""} rows={4} className="w-full rounded-md border bg-background px-3 py-2" />
      </label>
      <section className="space-y-4 rounded-md border bg-muted/30 p-4">
        <div>
          <h2 className="font-semibold">Family Relationships</h2>
          <p className="text-sm text-muted-foreground">
            Set direct parent and spouse relationships for this member.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1 text-sm font-medium">
            Father
            <select
              name="fatherMemberId"
              defaultValue={currentRelationships?.fatherMemberId ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="">No father selected</option>
              {fatherCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium">
            Mother
            <select
              name="motherMemberId"
              defaultValue={currentRelationships?.motherMemberId ?? ""}
              className="w-full rounded-md border bg-background px-3 py-2"
            >
              <option value="">No mother selected</option>
              {motherCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
          </label>
          <label className="space-y-1 text-sm font-medium">
            {spouseLabel}
            <select
              name="spouseMemberIds"
              multiple
              defaultValue={currentRelationships?.spouseMemberIds ?? []}
              className="h-32 w-full rounded-md border bg-background px-3 py-2"
            >
              {spouseCandidates.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.label}
                </option>
              ))}
            </select>
            <span className="text-xs text-muted-foreground">
              {selectedGender === "MALE"
                ? "Hold Cmd/Ctrl to select multiple wives."
                : "Select one husband."}
            </span>
          </label>
        </div>
      </section>
      {!isEdit ? (
        <div className="rounded-md border bg-muted/40 p-4">
          <label className="flex items-center gap-2 text-sm font-medium">
            <input name="createLogin" type="checkbox" />
            Create login account
          </label>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <label className="space-y-1 text-sm font-medium">
              Username
              <input name="username" className="w-full rounded-md border bg-background px-3 py-2" />
            </label>
            <label className="space-y-1 text-sm font-medium">
              Role
              <select name="role" defaultValue="MEMBER" className="w-full rounded-md border bg-background px-3 py-2">
                <option value="MEMBER">Member</option>
                <option value="PRESIDENT">President</option>
                <option value="SUPER_ADMIN">Super Admin</option>
              </select>
            </label>
          </div>
        </div>
      ) : null}
      <button
        disabled={mutation.isPending}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60"
      >
        {mutation.isPending ? "Saving..." : isEdit ? "Save changes" : "Create member"}
      </button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
      {credential ? (
        <div className="rounded-md border border-primary/30 bg-primary/10 p-4 text-sm">
          Generated password for <strong>{credential.username}</strong>:{" "}
          <code>{credential.temporaryPassword}</code>
        </div>
      ) : null}
    </form>
  );
}
