import Link from "next/link";
import { ElectionForm } from "@/components/admin/elections/election-actions";

export default function NewElectionPage() {
  return <div className="space-y-6"><Link href="/admin/elections" className="text-sm text-primary">Back to elections</Link><h1 className="text-2xl font-semibold tracking-tight">New Election</h1><ElectionForm /></div>;
}
