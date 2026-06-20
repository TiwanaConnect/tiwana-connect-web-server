import Link from "next/link";

import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function PushDeliveriesPage() {
  const deliveries = await prisma.pushDelivery.findMany({
    include: { member: true, pushToken: true, notification: true },
    orderBy: { createdAt: "desc" },
    take: 100
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/notifications" className="text-sm text-primary">Back to notifications</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Push Deliveries</h1>
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Member</th><th className="px-4 py-3">Provider</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Title</th><th className="px-4 py-3">Device</th><th className="px-4 py-3">Ticket</th><th className="px-4 py-3">Error</th><th className="px-4 py-3">Sent/Failed</th></tr></thead>
          <tbody className="divide-y">
            {deliveries.map((delivery) => (
              <tr key={delivery.id}>
                <td className="px-4 py-3">{delivery.member.fullName ?? delivery.member.alias ?? "Unnamed Member"}</td>
                <td className="px-4 py-3">{delivery.provider}</td>
                <td className="px-4 py-3">{delivery.status}</td>
                <td className="px-4 py-3">{delivery.title}</td>
                <td className="px-4 py-3">{delivery.pushToken?.deviceName ?? delivery.pushToken?.platform ?? "-"}</td>
                <td className="px-4 py-3">{delivery.providerTicketId ?? "-"}</td>
                <td className="px-4 py-3">{delivery.providerError ?? "-"}</td>
                <td className="px-4 py-3">{delivery.sentAt?.toLocaleString() ?? delivery.failedAt?.toLocaleString() ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
