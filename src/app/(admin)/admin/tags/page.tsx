import Link from "next/link";

import { DisableTagButton, TagForm } from "@/components/admin/directory/directory-actions";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export default async function TagsPage() {
  const tags = await prisma.memberTag.findMany({
    include: { members: true },
    orderBy: [{ isActive: "desc" }, { name: "asc" }]
  });

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/directory" className="text-sm text-primary">Back to directory</Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tags</h1>
      </div>
      <TagForm />
      <div className="overflow-hidden rounded-lg border bg-card">
        <table className="w-full text-left text-sm">
          <thead className="bg-muted text-xs uppercase text-muted-foreground"><tr><th className="px-4 py-3">Name</th><th className="px-4 py-3">Slug</th><th className="px-4 py-3">Type</th><th className="px-4 py-3">Color</th><th className="px-4 py-3">Active</th><th className="px-4 py-3">Usage</th><th className="px-4 py-3">Actions</th></tr></thead>
          <tbody className="divide-y">
            {tags.map((tag) => (
              <tr key={tag.id}>
                <td className="px-4 py-3 font-medium">{tag.name}</td>
                <td className="px-4 py-3">{tag.slug}</td>
                <td className="px-4 py-3">{tag.type}</td>
                <td className="px-4 py-3">{tag.color ?? "-"}</td>
                <td className="px-4 py-3">{tag.isActive ? "Yes" : "No"}</td>
                <td className="px-4 py-3">{tag.members.length}</td>
                <td className="px-4 py-3"><DisableTagButton tagId={tag.id} active={tag.isActive} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
