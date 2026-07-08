"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Golden "You won!" panel shown to the winner on the giveaway page,
 * with claim steps and an "I received my prize" confirmation button.
 */
export function WinnerClaim({
  winnerId,
  prize,
  claimed,
  steps,
  discordInviteUrl,
}: {
  winnerId: string;
  prize: string;
  claimed: boolean;
  steps: string[];
  discordInviteUrl?: string;
}) {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "working" | "done" | "error">(
    claimed ? "done" : "idle"
  );

  async function confirm() {
    setState("working");
    try {
      const res = await fetch(`/api/winners/${winnerId}/claim`, { method: "POST" });
      if (res.ok) {
        setState("done");
        router.refresh();
      } else {
        setState("error");
      }
    } catch {
      setState("error");
    }
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gold/40 bg-gold-deep/40 p-6">
      <div
        className="pointer-events-none absolute inset-0 animate-glow-pulse"
        style={{
          background:
            "radial-gradient(420px 160px at 50% 0%, rgba(242,193,78,0.16), transparent 70%)",
        }}
        aria-hidden
      />
      <div className="relative">
        <p className="font-display text-xl font-bold text-gold">
          🎉 Congratulations — you won {prize}!
        </p>

        {state === "done" ? (
          <p className="mt-3 text-sm text-snow">
            ✓ Prize received — enjoy it, gardener! 🌱
          </p>
        ) : (
          <>
            <p className="mt-2 text-sm text-fog">Here&apos;s how your prize gets to you:</p>
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm leading-relaxed text-snow">
              {steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            {discordInviteUrl && (
              <p className="mt-3 text-sm text-fog">
                Questions?{" "}
                <a
                  href={discordInviteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold underline"
                >
                  Join our Discord
                </a>{" "}
                and ask.
              </p>
            )}
            <button
              onClick={confirm}
              disabled={state === "working"}
              className="btn mt-4 border border-gold/50 bg-gold/15 text-gold hover:bg-gold/25"
            >
              {state === "working" ? "Saving…" : "I've received my prize ✓"}
            </button>
            {state === "error" && (
              <p className="mt-2 text-sm text-rose">Couldn&apos;t save — try again.</p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
