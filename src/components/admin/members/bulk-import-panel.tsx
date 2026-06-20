"use client";

import { useState } from "react";

const DEFAULT_MEMBER_CSV =
  "fullName,alias,gender,visibility,city,phone,profession,branchLabel,dateOfBirth,notes,createLogin,username,role\nMuhammad Arslan,,MALE,VISIBLE,Lahore,+920000000001,Engineer,Haji Ali branch,,,true,arslan2,MEMBER";

const DEFAULT_RELATIONSHIP_CSV =
  "fromMemberIdentifier,toMemberIdentifier,type\n+920000000001,+920000000002,FATHER";

export function BulkImportPanel({ type }: { type: "members" | "relationships" }) {
  const [csv, setCsv] = useState(
    type === "members" ? DEFAULT_MEMBER_CSV : DEFAULT_RELATIONSHIP_CSV
  );
  const [result, setResult] = useState<unknown>(null);

  async function submit(mode: "preview" | "import") {
    const base =
      type === "members"
        ? "/api/admin/members"
        : "/api/admin/relationships";
    const response = await fetch(`${base}/bulk-${mode}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ csv })
    });

    setResult(await response.json());
  }

  return (
    <div className="space-y-4 rounded-lg border bg-card p-6">
      <textarea
        value={csv}
        onChange={(event) => setCsv(event.target.value)}
        rows={10}
        className="w-full rounded-md border bg-background p-3 font-mono text-sm"
      />
      <div className="flex gap-2">
        <button onClick={() => submit("preview")} className="rounded-md border px-4 py-2 text-sm font-medium">
          Preview
        </button>
        <button onClick={() => submit("import")} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">
          Import valid rows
        </button>
      </div>
      {result ? (
        <pre className="max-h-96 overflow-auto rounded-md bg-muted p-4 text-xs">
          {JSON.stringify(result, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}
