"use client";

import { useEffect, useState } from "react";

function format(ms: number) {
  if (ms <= 0) return "Ended";
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${sec}s`;
  return `${m}m ${sec}s`;
}

/**
 * Live countdown with a "vine" progress bar showing how much of the giveaway
 * window has elapsed.
 */
export function Countdown({
  startsAt,
  endsAt,
  ended,
}: {
  startsAt: string;
  endsAt: string;
  ended: boolean;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = new Date(startsAt).getTime();
  const end = new Date(endsAt).getTime();
  const remaining = end - now;
  const isOver = ended || remaining <= 0;
  const progress = isOver ? 1 : Math.min(1, Math.max(0, (now - start) / Math.max(1, end - start)));

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-xs uppercase tracking-wider text-fog">
          {isOver ? "Closed" : "Ends in"}
        </span>
        <span
          className={`font-mono text-sm tabular-nums ${isOver ? "text-fog" : "text-leaf"}`}
          suppressHydrationWarning
        >
          {isOver ? "Ended" : format(remaining)}
        </span>
      </div>
      <div className="mt-2 h-1 overflow-hidden rounded-full bg-line" aria-hidden>
        <div
          className={`h-full rounded-full transition-[width] duration-1000 ${isOver ? "bg-fog/50" : "bg-leaf"}`}
          style={{ width: `${progress * 100}%` }}
        />
      </div>
    </div>
  );
}
