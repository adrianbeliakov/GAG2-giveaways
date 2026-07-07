"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** End / draw / delete controls for a giveaway (admin). */
export function GiveawayActions({
  giveawayId,
  status,
  hasWinners,
}: {
  giveawayId: string;
  status: "ACTIVE" | "ENDED";
  hasWinners: boolean;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function call(path: string, method: string, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(path);
    setMessage(null);
    try {
      const res = await fetch(path, { method });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage(data.error ?? "Something went wrong.");
      } else if (data.message) {
        setMessage(data.message);
      }
      router.refresh();
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {status === "ACTIVE" && (
        <button
          className="btn-ghost"
          disabled={busy !== null}
          onClick={() =>
            call(`/api/admin/giveaways/${giveawayId}/end`, "POST", "End this giveaway now? Nobody will be able to enter afterwards.")
          }
        >
          End early
        </button>
      )}
      <button
        className="btn-primary"
        disabled={busy !== null}
        onClick={() =>
          call(
            `/api/admin/giveaways/${giveawayId}/draw`,
            "POST",
            hasWinners
              ? "Winners already exist. Re-draw and replace them?"
              : status === "ACTIVE"
                ? "This ends the giveaway and draws winners now. Continue?"
                : "Draw winners from all valid entries?"
          )
        }
      >
        {busy?.endsWith("/draw") ? "Drawing…" : hasWinners ? "Re-draw winners" : "Draw winners"}
      </button>
      <button
        className="btn-danger"
        disabled={busy !== null}
        onClick={() =>
          call(`/api/admin/giveaways/${giveawayId}`, "DELETE", "Delete this giveaway and all of its entries? This cannot be undone.")
        }
      >
        Delete
      </button>
      {message && <p className="w-full text-sm text-gold">{message}</p>}
    </div>
  );
}
