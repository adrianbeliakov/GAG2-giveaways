"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      return;
    }
    router.push("/login?reset=1");
  }

  if (!token) {
    return <p className="text-center text-sm text-rose">This reset link is missing its token. Request a new one.</p>;
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="password" className="label">New password</label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          maxLength={72}
          autoComplete="new-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="confirm" className="label">Confirm password</label>
        <input
          id="confirm"
          type="password"
          required
          autoComplete="new-password"
          className="input"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-rose">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Saving…" : "Set new password"}
      </button>
    </form>
  );
}
