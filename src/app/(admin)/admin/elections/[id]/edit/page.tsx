import Link from "next/link";
export default async function EditElectionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <div className="space-y-4"><Link href={`/admin/elections/${id}`} className="text-sm text-primary">Back to election</Link><h1 className="text-2xl font-semibold">Edit Election</h1><p className="text-sm text-muted-foreground">Use the timeline page for date changes. API PATCH is available for full updates.</p></div>;
}
