"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

export function VerifyEmailClient() {
  const params = useSearchParams();
  const token = params.get("token");
  const [state, setState] = useState<"working" | "ok" | "error">("working");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setState("error");
      setError("This verification link is missing its token.");
      return;
    }
    fetch("/api/auth/verify-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    })
      .then(async (res) => {
        if (res.ok) {
          setState("ok");
        } else {
          const data = await res.json().catch(() => ({}));
          setState("error");
          setError(data.error ?? "Verification failed.");
        }
      })
      .catch(() => {
        setState("error");
        setError("Network error. Refresh to try again.");
      });
  }, [token]);

  if (state === "working") {
    return <p className="text-center text-sm text-fog">Verifying your email…</p>;
  }
  if (state === "ok") {
    return (
      <div className="space-y-3 text-center">
        <div className="text-4xl" aria-hidden>🌱</div>
        <h2 className="font-display text-lg font-semibold text-leaf">Email verified</h2>
        <p className="text-sm text-fog">You can now enter giveaways. Good luck!</p>
        <Link href="/login" className="btn-primary w-full">Log in</Link>
      </div>
    );
  }
  return (
    <div className="space-y-3 text-center">
      <p className="text-sm text-rose">{error}</p>
      <p className="text-sm text-fog">
        Log in and use “Resend verification email” to get a fresh link.
      </p>
      <Link href="/login" className="btn-ghost w-full">Go to log in</Link>
    </div>
  );
}
