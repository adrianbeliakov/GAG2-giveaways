"use client";

import { signIn } from "next-auth/react";

/**
 * Discord / Roblox sign-in buttons. The server page passes which providers
 * are configured, so unconfigured ones are simply not shown.
 */
export function OAuthButtons({
  discord,
  roblox,
  divider = true,
}: {
  discord: boolean;
  roblox: boolean;
  divider?: boolean;
}) {
  if (!discord && !roblox) return null;

  return (
    <div className={divider ? "mt-6" : ""}>
      {divider && (
        <div className="mb-4 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-line" />
          <span className="text-xs uppercase tracking-wider text-fog">or continue with</span>
          <span className="h-px flex-1 bg-line" />
        </div>
      )}

      <div className="space-y-2">
        {roblox && (
          <button
            type="button"
            onClick={() => signIn("roblox", { callbackUrl: "/" })}
            className="btn-ghost w-full"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d="M5.16 0 .07 18.84 18.84 24l5.09-18.84L5.16 0Zm9.14 14.62-4.92-1.33 1.33-4.92 4.92 1.33-1.33 4.92Z" />
            </svg>
            Continue with Roblox
          </button>
        )}
        {discord && (
          <button
            type="button"
            onClick={() => signIn("discord", { callbackUrl: "/" })}
            className="btn-ghost w-full"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4 fill-current" aria-hidden>
              <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.6 1.25a18.3 18.3 0 0 0-5.5 0 12.6 12.6 0 0 0-.61-1.25.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.88 1.52.07.07 0 0 0-.04.03C.53 9.05-.32 13.58.1 18.06c0 .02.01.04.03.05a19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.1 13 13 0 0 1-1.87-.9.08.08 0 0 1 0-.12l.36-.29a.07.07 0 0 1 .08 0 14.2 14.2 0 0 0 12.06 0 .07.07 0 0 1 .08 0l.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.88a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6.02-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.22 0 2.18 1.1 2.16 2.42 0 1.34-.94 2.42-2.16 2.42Z" />
            </svg>
            Continue with Discord
          </button>
        )}
      </div>
    </div>
  );
}
