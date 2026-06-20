import Link from "next/link";
import { notFound } from "next/navigation";

import { EventActions } from "@/components/admin/events/event-actions";
import { prisma } from "@/lib/db/prisma";
import { toAdminFamilyEventDto } from "@/server/dto/event.dto";
import { eventInclude } from "@/server/repositories/event.repository";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const rawEvent = await prisma.familyEvent.findUnique({ where: { id }, include: eventInclude });
  if (!rawEvent || rawEvent.deletedAt) notFound();
  const event = toAdminFamilyEventDto(rawEvent);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{event.title}</h1>
          <p className="text-sm text-muted-foreground">{event.type} · {event.status}</p>
        </div>
        <Link href={`/admin/events/${event.id}/edit`} className="rounded-md border px-4 py-2 text-sm font-medium">Edit</Link>
      </div>
      <section className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Going</p><p className="text-2xl font-semibold">{event.goingCount}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Maybe</p><p className="text-2xl font-semibold">{event.maybeCount}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Not going</p><p className="text-2xl font-semibold">{event.notGoingCount}</p></div>
        <div className="rounded-lg border bg-card p-4"><p className="text-sm text-muted-foreground">Pending</p><p className="text-2xl font-semibold">{event.pendingCount}</p></div>
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold">Details</h2>
          <dl className="mt-4 space-y-2 text-sm">
            <div>Start: {new Date(event.startAt).toLocaleString()}</div>
            <div>End: {event.endAt ? new Date(event.endAt).toLocaleString() : "-"}</div>
            <div>Location: {event.locationName ?? "-"}</div>
            <div>Address: {event.locationAddress ?? "-"}</div>
            <div>Created by: {event.createdBy.displayName}</div>
          </dl>
        </div>
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-semibold">Actions</h2>
          <div className="mt-4"><EventActions eventId={event.id} isPinned={event.isPinned} /></div>
        </div>
      </section>
      <section className="rounded-lg border bg-card p-6">
        <h2 className="font-semibold">Invites</h2>
        <div className="mt-4 divide-y">
          {rawEvent.invites.map((invite) => (
            <div key={invite.id} className="flex justify-between py-3 text-sm">
              <span>{invite.member?.fullName ?? invite.member?.alias ?? invite.memberId}</span>
              <span>{invite.rsvpStatus}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
