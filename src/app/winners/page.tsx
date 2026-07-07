import { prisma } from "@/lib/prisma";
import { closeExpiredGiveaways } from "@/lib/giveaways";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Winners" };

export default async function WinnersPage() {
  await closeExpiredGiveaways();

  const giveaways = await prisma.giveaway.findMany({
    where: { status: "ENDED" },
    orderBy: { endedAt: "desc" },
    take: 50,
    include: {
      winners: { include: { user: { select: { username: true } } } },
      _count: { select: { entries: { where: { removed: false } } } },
    },
  });

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-display text-2xl font-bold">Past winners</h1>
      <p className="mt-1 text-sm text-fog">
        Every ended giveaway and the winners drawn from its valid entries.
      </p>

      <div className="mt-6 space-y-3">
        {giveaways.length === 0 && (
          <div className="card p-8 text-center text-sm text-fog">
            No giveaways have ended yet.
          </div>
        )}
        {giveaways.map((g) => (
          <Link key={g.id} href={`/giveaways/${g.id}`} className="card block p-5 transition hover:border-gold/40">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="font-display font-semibold">{g.title}</h2>
              <span className="text-xs text-fog">
                {g._count.entries} entries ·{" "}
                {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(g.endedAt ?? g.endsAt)}
              </span>
            </div>
            <p className="mt-1 text-sm text-gold">🏆 {g.prize}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {g.winners.length === 0 ? (
                <span className="chip border border-line text-fog">Winners not drawn yet</span>
              ) : (
                g.winners.map((w) => (
                  <span key={w.id} className="chip bg-gold-deep text-gold">
                    🎉 {w.user.username}
                  </span>
                ))
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
