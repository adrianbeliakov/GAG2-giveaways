"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ConnectAccountButton } from "@/components/connect-account-button";

type Props = {
  giveawayId: string;
  isLoggedIn: boolean;
  isVerified: boolean;
  isBanned: boolean;
  hasEntered: boolean;
  isActive: boolean;
  hasRoblox: boolean;
  robloxLoginEnabled: boolean;
};

/** One-click giveaway entry with inline state feedback. */
export function EnterButton(props: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [entered, setEntered] = useState(props.hasEntered);

  if (!props.isActive) {
    return <p className="text-sm text-fog">This giveaway has ended.</p>;
  }
  if (!props.isLoggedIn) {
    return (
      <Link href="/login" className="btn-primary w-full sm:w-auto">
        Log in to enter
      </Link>
    );
  }
  if (props.isBanned) {
    return <p className="text-sm text-rose">Your account is not eligible to enter giveaways.</p>;
  }
  if (!props.isVerified) {
    return (
      <div className="text-sm text-fog">
        Verify your email to enter. <ResendLink />
      </div>
    );
  }
  if (entered) {
    return (
      <div className="chip bg-leaf-deep px-4 py-2 text-sm text-leaf">
        ✓ You&apos;re in — good luck!
      </div>
    );
  }

  // Prizes are delivered in Roblox — a linked Roblox account is required.
  if (!props.hasRoblox) {
    return (
      <div className="rounded-xl border border-line bg-soil p-4">
        <p className="text-sm font-semibold">
          🎁 Prizes are delivered in Roblox
        </p>
        <p className="mt-1 text-sm text-fog">
          Connect your Roblox account so we can deliver your prize if you win — it takes
          10 seconds and you only do it once.
        </p>
        {props.robloxLoginEnabled ? (
          <div className="mt-3">
            <ConnectAccountButton
              provider="roblox"
              callbackUrl={`/giveaways/${props.giveawayId}`}
              className="btn-primary"
            >
              Connect Roblox to enter
            </ConnectAccountButton>
          </div>
        ) : (
          <p className="mt-3 text-sm text-gold">
            Roblox connections are temporarily unavailable — please try again soon.
          </p>
        )}
      </div>
    );
  }

  async function enter() {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/giveaways/${props.giveawayId}/enter`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setEntered(true);
        router.refresh();
      } else {
        setMessage(data.error ?? "Something went wrong. Try again.");
      }
    } catch {
      setMessage("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={enter} disabled={loading} className="btn-primary w-full sm:w-auto">
        {loading ? "Entering…" : "Enter giveaway"}
      </button>
      {message && <p className="mt-2 text-sm text-rose">{message}</p>}
    </div>
  );
}

function ResendLink() {
  const [state, setState] = useState<"idle" | "sending" | "sent">("idle");
  async function resend() {
    setState("sending");
    const res = await fetch("/api/auth/resend-verification", { method: "POST" });
    setState(res.ok ? "sent" : "idle");
  }
  if (state === "sent") return <span className="text-leaf">Verification email sent.</span>;
  return (
    <button onClick={resend} disabled={state === "sending"} className="text-leaf underline">
      {state === "sending" ? "Sending…" : "Resend verification email"}
    </button>
  );
}
