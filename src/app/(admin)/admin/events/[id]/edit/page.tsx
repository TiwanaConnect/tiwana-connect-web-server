import { notFound } from "next/navigation";

import { EventForm } from "@/components/admin/events/event-form";
import { prisma } from "@/lib/db/prisma";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await prisma.familyEvent.findUnique({ where: { id } });
  if (!event || event.deletedAt) notFound();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Edit Event</h1>
        <p className="text-sm text-muted-foreground">Update event details and status.</p>
      </div>
      <EventForm mode="edit" event={event} members={[]} />
    </div>
  );
}
