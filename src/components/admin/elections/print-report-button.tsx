"use client";

export function PrintReportButton() {
  return (
    <button onClick={() => globalThis.print()} className="rounded-md border px-4 py-2 text-sm font-medium">
      Print report
    </button>
  );
}
