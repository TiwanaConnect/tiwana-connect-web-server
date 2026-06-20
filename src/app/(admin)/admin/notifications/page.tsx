import Link from "next/link";

import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function AdminNotificationsPage() {
  const [notifications, stats] = await Promise.all([
    prisma.notification.findMany({
      where: { deletedAt: null },
      include: { member: true, pushDeliveries: true },
      orderBy: { createdAt: "desc" },
      take: 100
    }),
    Promise.all([
      prisma.notification.count({ where: { deletedAt: null } }),
      prisma.notification.count({ where: { status: "UNREAD", deletedAt: null } }),
      prisma.pushDelivery.count({ where: { status: "SENT" } }),
      prisma.pushDelivery.count({ where: { status: { in: ["FAILED", "DEVICE_NOT_REGISTERED"] } } })
    ])
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">In-app notifications and push summary.</p>
        </div>
        <Link href="/admin/push-deliveries" className="rounded-md border px-3 py-2 text-sm font-medium">Push Deliveries</Link>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {[
          ["Total", stats[0]],
          ["Unread", stats[1]],
          ["Push sent", stats[2]],
          ["Push failed", stats[3]]
        ].map(([label, value]) => <div key={label} className="rounded-lg border bg-card p-4"><div className="text-xs uppercase text-muted-foreground">{label}</div><div className="mt-1 text-xl font-semibold">{value}</div></div>)}
      </div>
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Title</th><th className="px-4 py-3">Member</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Push</th><th className="px-4 py-3">Created</th></tr></thead>
          <tbody className="divide-y">
            {notifications.map((notification) => (
              <tr key={notification.id}>
                <td className="px-4 py-3 font-medium">{notification.title}</td>
                <td className="px-4 py-3">{notification.member.fullName ?? notification.member.alias ?? "Unnamed Member"}</td>
                <td className="px-4 py-3">{notification.type}</td>
                <td className="px-4 py-3">{notification.status}</td>
                <td className="px-4 py-3">{notification.pushDeliveries.filter((delivery) => delivery.status === "SENT").length}/{notification.pushDeliveries.length}</td>
                <td className="px-4 py-3">{notification.createdAt.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
