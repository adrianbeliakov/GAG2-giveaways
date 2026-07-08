"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";

/**
 * "Connect Discord/Roblox" button for logged-in users. Arms the server-side
 * link-intent cookie first, then starts the OAuth flow — so the external
 * account is attached to the CURRENT user instead of signing into a new one.
 */
export function ConnectAccountButton({
  provider,
  callbackUrl = "/profile",
  className = "btn-ghost",
  children,
}: {
  provider: "discord" | "roblox";
  callbackUrl?: string;
  className?: string;
  children?: React.ReactNode;
}) {
  const [state, setState] = useState<"idle" | "working" | "error">("idle");

  async function connect() {
    setState("working");
    try {
      const res = await fetch("/api/connections/start", { method: "POST" });
      if (!res.ok) {
        setState("error");
        return;
      }
      await signIn(provider, { callbackUrl });
    } catch {
      setState("error");
    }
  }

  return (
    <span>
      <button type="button" onClick={connect} disabled={state === "working"} className={className}>
        {state === "working"
          ? "Redirecting…"
          : (children ?? `Connect ${provider === "roblox" ? "Roblox" : "Discord"}`)}
      </button>
      {state === "error" && (
        <span className="ml-2 text-xs text-rose">Couldn&apos;t start — try again.</span>
      )}
    </span>
  );
}
