import { MembersListClient } from "@/components/admin/members/members-list-client";

export default async function MembersPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const search = typeof params.search === "string" ? params.search : "";
  const status = typeof params.status === "string" ? params.status : "";
  const isFamilyHead =
    typeof params.isFamilyHead === "string" ? params.isFamilyHead : "";
  const page = Math.max(1, Number(typeof params.page === "string" ? params.page : "1") || 1);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage family members and optional login access.
          </p>
        </div>
      </div>
      <MembersListClient initialFilters={{ search, status, isFamilyHead, page }} />
    </div>
  );
}
