import { EventForm } from "@/components/admin/events/event-form";
import { prisma } from "@/lib/db/prisma";

export default async function NewEventPage() {
  const members = await prisma.member.findMany({
    where: { deletedAt: null, status: "ACTIVE" },
    orderBy: [{ fullName: "asc" }, { alias: "asc" }],
    select: { id: true, fullName: true, alias: true, initials: true }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create Event</h1>
        <p className="text-sm text-muted-foreground">Create an official family event or meeting.</p>
      </div>
      <EventForm
        mode="create"
        members={members.map((member) => ({
          id: member.id,
          label: member.fullName ?? member.alias ?? "Unnamed Member"
        }))}
      />
    </div>
  );
}
