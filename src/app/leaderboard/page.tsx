import Link from "next/link";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Leaderboard" };

type Row = { username: string; count: number };

async function topWinners(limit: number): Promise<Row[]> {
  const grouped = await prisma.winner.groupBy({
    by: ["userId"],
    _count: { userId: true },
    orderBy: { _count: { userId: "desc" } },
    take: limit * 2, // fetch extra so filtered rows (banned/admin) don't shrink the board
  });
  if (grouped.length === 0) return [];

  const users = await prisma.user.findMany({
    where: {
      id: { in: grouped.map((g) => g.userId) },
      banned: false,
      role: "USER", // the gardener-in-chief doesn't compete 🌱
    },
    select: { id: true, username: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.username]));

  return grouped
    .filter((g) => nameById.has(g.userId))
    .slice(0, limit)
    .map((g) => ({ username: nameById.get(g.userId)!, count: g._count.userId }));
}

async function topEntrants(limit: number): Promise<Row[]> {
  const grouped = await prisma.entry.groupBy({
    by: ["userId"],
    where: { removed: false },
    _count: { userId: true },
    orderBy: { _count: { userId: "desc" } },
    take: limit * 2,
  });
  if (grouped.length === 0) return [];

  const users = await prisma.user.findMany({
    where: {
      id: { in: grouped.map((g) => g.userId) },
      banned: false,
      role: "USER",
    },
    select: { id: true, username: true },
  });
  const nameById = new Map(users.map((u) => [u.id, u.username]));

  return grouped
    .filter((g) => nameById.has(g.userId))
    .slice(0, limit)
    .map((g) => ({ username: nameById.get(g.userId)!, count: g._count.userId }));
}

const MEDALS = ["🥇", "🥈", "🥉"];

function Board({
  title,
  subtitle,
  rows,
  unit,
  accent,
}: {
  title: string;
  subtitle: string;
  rows: Row[];
  unit: [string, string]; // [singular, plural]
  accent: "gold" | "leaf";
}) {
  const accentText = accent === "gold" ? "text-gold" : "text-leaf";
  const accentBg = accent === "gold" ? "bg-gold-deep" : "bg-leaf-deep";

  return (
    <section className="card-lux p-6">
      <h2 className={`font-display text-xl font-semibold ${accentText}`}>{title}</h2>
      <p className="mt-1 text-sm text-fog">{subtitle}</p>

      {rows.length === 0 ? (
        <p className="mt-6 text-sm text-fog">
          Nothing here yet — the garden is still young. 🌱
        </p>
      ) : (
        <ol className="mt-5 space-y-2">
          {rows.map((r, i) => (
            <li
              key={r.username}
              className={`flex animate-rise items-center gap-3 rounded-xl border border-line bg-soil p-3 ${
                i === 0 ? "border-opacity-100 " + (accent === "gold" ? "border-gold/40" : "border-leaf/40") : ""
              }`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <span
                className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg font-mono text-sm font-bold ${
                  i < 3 ? accentBg + " text-lg" : "bg-line/50 text-fog"
                }`}
                aria-hidden
              >
                {i < 3 ? MEDALS[i] : i + 1}
              </span>
              <span className="min-w-0 flex-1 truncate font-display font-semibold">
                {r.username}
              </span>
              <span className={`shrink-0 font-mono text-sm font-bold ${accentText}`}>
                {r.count} {r.count === 1 ? unit[0] : unit[1]}
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

export default async function LeaderboardPage() {
  const [winners, entrants] = await Promise.all([topWinners(10), topEntrants(10)]);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8 text-center">
        <p className="eyebrow">Hall of fame</p>
        <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">Leaderboard</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-fog">
          The luckiest and the most dedicated gardeners of GAG2 Giveaways. Will your name
          grow here?
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Board
          title="🏆 Most wins"
          subtitle="Fortune favours these gardeners"
          rows={winners}
          unit={["win", "wins"]}
          accent="gold"
        />
        <Board
          title="🎟️ Most entries"
          subtitle="The most dedicated players"
          rows={entrants}
          unit={["entry", "entries"]}
          accent="leaf"
        />
      </div>

      <p className="mt-8 text-center text-sm text-fog">
        Want in?{" "}
        <Link href="/" className="text-leaf hover:underline">
          Enter an active giveaway →
        </Link>
      </p>
    </div>
  );
}
