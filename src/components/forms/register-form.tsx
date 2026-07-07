"use client";

import { useState } from "react";
import Link from "next/link";
import { Turnstile } from "@/components/turnstile";

export function RegisterForm() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, email, password, captchaToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Try again.");
        return;
      }
      setDone(true);
    } catch {
      setError("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-3 text-center">
        <div className="text-4xl" aria-hidden>📬</div>
        <h2 className="font-display text-lg font-semibold">Check your inbox</h2>
        <p className="text-sm text-fog">
          We sent a verification link to <span className="text-snow">{email}</span>. Verify your
          email, then log in to start entering giveaways.
        </p>
        <Link href="/login" className="btn-primary w-full">
          Go to log in
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <label htmlFor="username" className="label">Username</label>
        <input
          id="username"
          required
          minLength={3}
          maxLength={20}
          pattern="[a-zA-Z0-9_]+"
          title="Letters, numbers and underscores only"
          autoComplete="username"
          className="input"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <p className="mt-1 text-xs text-fog">3–20 characters. Letters, numbers, underscores.</p>
      </div>
      <div>
        <label htmlFor="email" className="label">Email</label>
        <input
          id="email"
          type="email"
          required
          autoComplete="email"
          className="input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div>
        <label htmlFor="password" className="label">Password</label>
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
        <p className="mt-1 text-xs text-fog">At least 8 characters.</p>
      </div>

      <Turnstile onToken={setCaptchaToken} />

      {error && <p className="text-sm text-rose">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Creating account…" : "Create account"}
      </button>
      <p className="text-center text-sm text-fog">
        Already have an account?{" "}
        <Link href="/login" className="text-leaf hover:underline">
          Log in
        </Link>
      </p>
    </form>
  );
}
