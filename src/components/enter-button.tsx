"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Props = {
  giveawayId: string;
  isLoggedIn: boolean;
  isVerified: boolean;
  isBanned: boolean;
  hasEntered: boolean;
  isActive: boolean;
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
        Verify your email to enter.{" "}
        <ResendLink />
      </div>
    );
  }
  if (entered) {
    return (
      <div className="chip bg-leaf-deep px-4 py-2 text-sm text-leaf">✓ You&apos;re in — good luck!</div>
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
