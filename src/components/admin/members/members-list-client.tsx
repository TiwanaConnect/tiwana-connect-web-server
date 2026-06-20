"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

import { apiRequest } from "@/lib/api/client";
import { MemberListLoginActions } from "./member-list-login-actions";

type MemberListFilters = {
  search: string;
  status: string;
  isFamilyHead: string;
  page: number;
};

type AdminMember = {
  id: string;
  fullName: string | null;
  alias: string | null;
  gender: string;
  visibility: string;
  isFamilyHead: boolean;
  city: string | null;
  phone: string | null;
  status: string;
  createdAt: string | Date;
  userAccount: {
    role: string;
    isActive: boolean;
  } | null;
};

type MemberListResponse = {
  members: AdminMember[];
  totalMembers: number;
  page: number;
  limit: number;
  totalPages: number;
};

export function MembersListClient({ initialFilters }: { initialFilters: MemberListFilters }) {
  const router = useRouter();
  const [filters, setFilters] = useState(initialFilters);
  const query = useQuery({
    queryKey: ["admin", "members", filters],
    queryFn: () => {
      const params = new URLSearchParams();
      if (filters.search) params.set("search", filters.search);
      if (filters.status) params.set("status", filters.status);
      if (filters.isFamilyHead) params.set("isFamilyHead", filters.isFamilyHead);
      params.set("page", String(filters.page));
      params.set("limit", "20");
      return apiRequest<MemberListResponse>(`/api/admin/members?${params.toString()}`);
    }
  });
  const data = query.data;

  function applyFilters(nextFilters: MemberListFilters) {
    setFilters(nextFilters);
    const params = new URLSearchParams();
    if (nextFilters.search) params.set("search", nextFilters.search);
    if (nextFilters.status) params.set("status", nextFilters.status);
    if (nextFilters.isFamilyHead) params.set("isFamilyHead", nextFilters.isFamilyHead);
    params.set("page", String(nextFilters.page));
    router.replace(`/admin/members?${params.toString()}`, { scroll: false });
  }

  function onFilter(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    applyFilters({
      search: String(form.get("search") ?? ""),
      status: String(form.get("status") ?? ""),
      isFamilyHead: String(form.get("isFamilyHead") ?? ""),
      page: 1
    });
  }

  function setPage(page: number) {
    applyFilters({ ...filters, page });
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end gap-2">
        <Link href="/admin/members/bulk-import" className="rounded-md border px-4 py-2 text-sm font-medium">
          Bulk Import
        </Link>
        <Link href="/admin/members/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          New Member
        </Link>
      </div>
      <form onSubmit={onFilter} className="flex flex-wrap gap-3 rounded-lg border bg-card p-4">
        <input name="search" defaultValue={filters.search} placeholder="Search ID, name, alias, phone, city" className="min-w-64 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        <select name="status" defaultValue={filters.status} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="BLOCKED">Blocked</option>
          <option value="PENDING">Pending</option>
        </select>
        <select name="isFamilyHead" defaultValue={filters.isFamilyHead} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">All family heads</option>
          <option value="true">Family heads</option>
          <option value="false">Not family heads</option>
        </select>
        <button className="rounded-md border px-4 py-2 text-sm font-medium">Filter</button>
      </form>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Name / alias</th>
              <th className="px-4 py-3">Gender</th>
              <th className="px-4 py-3">Visibility</th>
              <th className="px-4 py-3">Head</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Login Access</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Created</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {query.isLoading ? (
              <tr><td className="px-4 py-8 text-muted-foreground" colSpan={10}>Loading members...</td></tr>
            ) : null}
            {query.isError ? (
              <tr><td className="px-4 py-8 text-red-600" colSpan={10}>Unable to load members.</td></tr>
            ) : null}
            {data?.members.map((member) => (
              <tr key={member.id}>
                <td className="px-4 py-3 font-medium">
                  {member.fullName ?? member.alias ?? "Unnamed Member"}
                  <span className="block text-xs text-muted-foreground">ID: {member.id}</span>
                  {member.alias ? <span className="block text-xs text-muted-foreground">{member.alias}</span> : null}
                </td>
                <td className="px-4 py-3">{member.gender}</td>
                <td className="px-4 py-3">{member.visibility}</td>
                <td className="px-4 py-3">
                  {member.isFamilyHead ? (
                    <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                      Head
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td className="px-4 py-3">{member.city ?? "-"}</td>
                <td className="px-4 py-3">{member.phone ?? "-"}</td>
                <td className="px-4 py-3">
                  {member.userAccount
                    ? member.userAccount.isActive
                      ? `Has Account (${member.userAccount.role})`
                      : "Inactive Login"
                    : "No Login"}
                </td>
                <td className="px-4 py-3">{member.status}</td>
                <td className="px-4 py-3">{new Date(member.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Link href={`/admin/members/${member.id}`} className="text-primary">View</Link>
                    <Link href={`/admin/members/${member.id}/edit`} className="text-primary">Edit</Link>
                    <MemberListLoginActions
                      memberId={member.id}
                      memberName={member.fullName ?? member.alias ?? "Unnamed Member"}
                      hasLogin={Boolean(member.userAccount)}
                      isLoginActive={Boolean(member.userAccount?.isActive)}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-col gap-3 rounded-lg border bg-card p-4 text-sm md:flex-row md:items-center md:justify-between">
        <p className="text-muted-foreground">
          Showing {data && data.members.length > 0 ? (data.page - 1) * data.limit + 1 : 0}
          {"-"}
          {data ? Math.min(data.page * data.limit, data.totalMembers) : 0} of {data?.totalMembers ?? 0} members
        </p>
        <div className="flex items-center gap-2">
          <button
            disabled={!data || data.page <= 1}
            onClick={() => data && setPage(Math.max(1, data.page - 1))}
            className="rounded-md border px-3 py-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-2 text-muted-foreground">
            Page {data?.page ?? filters.page} of {data?.totalPages ?? 1}
          </span>
          <button
            disabled={!data || data.page >= data.totalPages}
            onClick={() => data && setPage(Math.min(data.totalPages, data.page + 1))}
            className="rounded-md border px-3 py-2 disabled:pointer-events-none disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
