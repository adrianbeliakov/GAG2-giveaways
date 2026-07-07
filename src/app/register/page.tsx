import { RegisterForm } from "@/components/forms/register-form";
import { OAuthButtons } from "@/components/forms/oauth-buttons";

export const metadata = { title: "Sign up" };

export default function RegisterPage() {
  const discord = Boolean(process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET);
  const roblox = Boolean(process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET);

  return (
    <div className="mx-auto max-w-sm pt-8">
      <div className="card animate-rise p-6 sm:p-8">
        <h1 className="mb-1 text-center font-display text-2xl font-bold">Create your account</h1>
        <p className="mb-6 text-center text-sm text-fog">
          Sign up with Roblox or Discord, or use your email — then enter any giveaway with one
          click.
        </p>
        <OAuthButtons discord={discord} roblox={roblox} divider={false} />
        <div className="mt-6 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs uppercase tracking-wider text-fog">or with email</span>
          <span className="h-px flex-1 bg-line" />
        </div>
        <div className="mt-6">
          <RegisterForm />
        </div>
      </div>
    </div>
  );
}
