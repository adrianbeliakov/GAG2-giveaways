import { Suspense } from "react";
import { LoginForm } from "@/components/forms/login-form";
import { OAuthButtons } from "@/components/forms/oauth-buttons";

export const metadata = { title: "Log in" };

export default function LoginPage() {
  const discord = Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
  const roblox = Boolean(process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET);

  return (
    <div className="mx-auto max-w-sm pt-8">
      <div className="card animate-rise p-6 sm:p-8">
        <h1 className="mb-6 text-center font-display text-2xl font-bold">Welcome back</h1>
        <Suspense>
          <LoginForm />
        </Suspense>
        <OAuthButtons discord={discord} roblox={roblox} />
      </div>
    </div>
  );
}
