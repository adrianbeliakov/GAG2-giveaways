"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Ban / unban a user (admin). Always a manual decision. */
export function UserBanButton({ userId, banned }: { userId: string; banned: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggle() {
    let reason: string | undefined;
    if (!banned) {
      const input = window.prompt("Reason for the ban (kept in the audit log):");
      if (input === null) return;
      reason = input || undefined;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/users/${userId}/ban`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ banned: !banned, reason }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed");
    }
    setBusy(false);
    router.refresh();
  }

  return (
    <span>
      <button
        onClick={toggle}
        disabled={busy}
        className={banned ? "btn-ghost !px-3 !py-1.5 text-xs" : "btn-danger !px-3 !py-1.5 text-xs"}
      >
        {busy ? "…" : banned ? "Unban" : "Ban"}
      </button>
      {error && <span className="ml-2 text-xs text-rose">{error}</span>}
    </span>
  );
}
