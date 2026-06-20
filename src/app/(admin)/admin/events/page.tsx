import Link from "next/link";

import { prisma } from "@/lib/db/prisma";
import { toAdminFamilyEventDto } from "@/server/dto/event.dto";
import { eventInclude } from "@/server/repositories/event.repository";

export default async function EventsPage({
  searchParams
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = typeof params.status === "string" ? params.status : "";
  const events = await prisma.familyEvent.findMany({
    where: {
      deletedAt: null,
      ...(q ? { title: { contains: q, mode: "insensitive" } } : {}),
      ...(status ? { status: status as never } : {})
    },
    include: eventInclude,
    orderBy: [{ isPinned: "desc" }, { startAt: "desc" }]
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Events</h1>
          <p className="text-sm text-muted-foreground">Manage official and member-created family events.</p>
        </div>
        <Link href="/admin/events/new" className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          New Event
        </Link>
      </div>
      <form className="flex flex-wrap gap-3 rounded-lg border bg-card p-4">
        <input name="q" defaultValue={q} placeholder="Search events" className="min-w-64 flex-1 rounded-md border bg-background px-3 py-2 text-sm" />
        <select name="status" defaultValue={status} className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">All statuses</option>
          <option value="PUBLISHED">Published</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="COMPLETED">Completed</option>
          <option value="DRAFT">Draft</option>
        </select>
        <button className="rounded-md border px-4 py-2 text-sm font-medium">Filter</button>
      </form>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Badges</th>
              <th className="px-4 py-3">Start date</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Created by</th>
              <th className="px-4 py-3">RSVP</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {events.map((rawEvent) => {
              const event = toAdminFamilyEventDto(rawEvent);
              return (
                <tr key={event.id}>
                  <td className="px-4 py-3 font-medium">{event.title}</td>
                  <td className="px-4 py-3">{event.type}</td>
                  <td className="px-4 py-3">{event.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {event.isOfficial ? <span className="rounded-full bg-primary/10 px-2 py-1 text-xs text-primary">Official</span> : null}
                      {event.isPinned ? <span className="rounded-full bg-muted px-2 py-1 text-xs">Pinned</span> : null}
                    </div>
                  </td>
                  <td className="px-4 py-3">{new Date(event.startAt).toLocaleString()}</td>
                  <td className="px-4 py-3">{event.locationName ?? "-"}</td>
                  <td className="px-4 py-3">{event.createdBy.displayName}</td>
                  <td className="px-4 py-3">{event.goingCount}/{event.invitedCount} going</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Link href={`/admin/events/${event.id}`} className="text-primary">View</Link>
                      <Link href={`/admin/events/${event.id}/edit`} className="text-primary">Edit</Link>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
