"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Soft-remove / restore an entry during suspicious-activity review (admin). */
export function EntryActions({ entryId, removed }: { entryId: string; removed: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    let reason: string | undefined;
    if (!removed) {
      const input = window.prompt("Reason for removing this entry (kept in the audit log):");
      if (input === null) return; // cancelled
      reason = input || undefined;
    }
    setBusy(true);
    await fetch(`/api/admin/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removed: !removed, reason }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <button onClick={toggle} disabled={busy} className={removed ? "btn-ghost !px-3 !py-1.5 text-xs" : "btn-danger !px-3 !py-1.5 text-xs"}>
      {busy ? "…" : removed ? "Restore" : "Remove"}
    </button>
  );
}
