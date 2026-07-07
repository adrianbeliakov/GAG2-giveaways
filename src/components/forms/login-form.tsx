"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(() => {
    // Auth.js redirects failed external sign-ins back with ?error=...
    const authError = params.get("error");
    if (!authError) return null;
    if (authError === "AccessDenied") return "Sign-in was cancelled or denied.";
    return "Couldn't complete that sign-in. Please try again.";
  });
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn("credentials", { email, password, redirect: false });

    if (res?.error) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }
    const next = params.get("next");
    router.push(next && next.startsWith("/") ? next : "/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
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
          autoComplete="current-password"
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>
      {error && <p className="text-sm text-rose">{error}</p>}
      <button type="submit" disabled={loading} className="btn-primary w-full">
        {loading ? "Logging in…" : "Log in"}
      </button>
      <p className="text-center text-sm text-fog">
        <Link href="/forgot-password" className="text-leaf hover:underline">
          Forgot your password?
        </Link>
      </p>
      <p className="text-center text-sm text-fog">
        New here?{" "}
        <Link href="/register" className="text-leaf hover:underline">
          Create an account
        </Link>
      </p>
    </form>
  );
}
