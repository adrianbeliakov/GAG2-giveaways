import Link from "next/link";
import { Countdown } from "@/components/countdown";
import { StatusBadge } from "@/components/status-badge";

type GiveawayCardData = {
  id: string;
  title: string;
  description: string;
  prize: string;
  status: "ACTIVE" | "ENDED";
  createdAt: Date;
  endsAt: Date;
  participants: number;
};

export function GiveawayCard({ g, index = 0 }: { g: GiveawayCardData; index?: number }) {
  const active = g.status === "ACTIVE" && g.endsAt > new Date();

  return (
    <Link
      href={`/giveaways/${g.id}`}
      className="card-lux group flex animate-rise flex-col p-5"
      style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
    >
      {/* Corner bloom that brightens on hover */}
      <div
        className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(closest-side, rgba(110,231,160,0.18), transparent 70%)",
        }}
        aria-hidden
      />

      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg font-semibold leading-snug transition-colors group-hover:text-leaf">
          {g.title}
        </h3>
        <StatusBadge active={active} />
      </div>

      <p className="mt-2 line-clamp-2 text-sm text-fog">{g.description}</p>

      <div className="mt-4 flex items-center gap-2">
        <span className="chip bg-gold-deep text-gold transition-transform duration-300 group-hover:scale-105">
          🏆 {g.prize}
        </span>
        <span className="chip border border-line text-fog">
          {g.participants} {g.participants === 1 ? "entry" : "entries"}
        </span>
      </div>

      <div className="mt-5">
        <Countdown
          startsAt={g.createdAt.toISOString()}
          endsAt={g.endsAt.toISOString()}
          ended={!active}
        />
      </div>
    </Link>
  );
}
