"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";

type Props = {
  fundId: string;
  members: Array<{ id: string; label: string }>;
};

export function FundTransactionForm({ fundId, members }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    setMessage(null);
    const data = new FormData(event.currentTarget);
    const payload = {
      type: String(data.get("type") ?? "CONTRIBUTION"),
      status: String(data.get("status") ?? "CONFIRMED"),
      amount: String(data.get("amount") ?? ""),
      currency: String(data.get("currency") ?? "PKR"),
      contributorId: String(data.get("contributorId") ?? ""),
      recipientMemberId: String(data.get("recipientMemberId") ?? ""),
      paymentMethod: String(data.get("paymentMethod") ?? "") || undefined,
      referenceNumber: String(data.get("referenceNumber") ?? ""),
      note: String(data.get("note") ?? ""),
      requestId: String(data.get("requestId") ?? "")
    };
    try {
      const response = await fetch(`/api/admin/funds/${fundId}/transactions`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload)
      });
      const json = await response.json();
      if (!response.ok) {
        const errorMessage = json.error?.message ?? "Request failed.";
        setMessage(errorMessage);
        toast.error(errorMessage);
        return;
      }
      setMessage("Transaction recorded.");
      toast.success("Transaction recorded.");
      event.currentTarget.reset();
      router.refresh();
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border bg-card p-4">
      <h2 className="font-semibold">Record Transaction</h2>
      <div className="grid gap-3 md:grid-cols-3">
        <select name="type" className="rounded-md border bg-background px-3 py-2 text-sm">
          {["CONTRIBUTION", "ZAKAT_INCOME", "SADAQAH_INCOME", "EXPENSE", "DISBURSEMENT", "REFUND", "ADJUSTMENT"].map((type) => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
        <select name="status" defaultValue="CONFIRMED" className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="CONFIRMED">Confirmed</option>
          <option value="PENDING">Pending</option>
        </select>
        <input name="amount" required type="number" min="0.01" step="0.01" placeholder="Amount" className="rounded-md border bg-background px-3 py-2 text-sm" />
        <input name="currency" defaultValue="PKR" maxLength={3} className="rounded-md border bg-background px-3 py-2 text-sm" />
        <select name="contributorId" className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Contributor</option>
          {members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
        </select>
        <select name="recipientMemberId" className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Recipient</option>
          {members.map((member) => <option key={member.id} value={member.id}>{member.label}</option>)}
        </select>
        <select name="paymentMethod" className="rounded-md border bg-background px-3 py-2 text-sm">
          <option value="">Payment method</option>
          {["CASH", "BANK_TRANSFER", "EASYPAISA", "JAZZCASH", "OTHER"].map((method) => <option key={method} value={method}>{method}</option>)}
        </select>
        <input name="referenceNumber" placeholder="Reference" className="rounded-md border bg-background px-3 py-2 text-sm" />
        <input name="requestId" placeholder="Request ID" className="rounded-md border bg-background px-3 py-2 text-sm" />
      </div>
      <textarea name="note" rows={2} placeholder="Note" className="w-full rounded-md border bg-background px-3 py-2 text-sm" />
      <button disabled={isSubmitting} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:cursor-not-allowed disabled:opacity-60">
        {isSubmitting ? "Recording..." : "Record"}
      </button>
      {message ? <p className="text-sm text-muted-foreground">{message}</p> : null}
    </form>
  );
}
