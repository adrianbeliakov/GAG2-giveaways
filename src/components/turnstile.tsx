"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    turnstile?: {
      render: (el: HTMLElement, opts: Record<string, unknown>) => string;
      remove: (id: string) => void;
    };
  }
}

/**
 * Cloudflare Turnstile widget. Renders nothing when
 * NEXT_PUBLIC_TURNSTILE_SITE_KEY is unset (local development – the server
 * skips verification too).
 */
export function Turnstile({ onToken }: { onToken: (token: string) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey || !ref.current) return;

    let widgetId: string | undefined;
    const render = () => {
      if (window.turnstile && ref.current) {
        widgetId = window.turnstile.render(ref.current, {
          sitekey: siteKey,
          theme: "dark",
          callback: onToken,
        });
      }
    };

    if (window.turnstile) {
      render();
    } else {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js";
      script.async = true;
      script.onload = render;
      document.head.appendChild(script);
    }

    return () => {
      if (widgetId && window.turnstile) window.turnstile.remove(widgetId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={ref} className="my-2" />;
}
