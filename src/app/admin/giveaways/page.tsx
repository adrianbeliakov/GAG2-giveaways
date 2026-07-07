import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { closeExpiredGiveaways } from "@/lib/giveaways";
import { GiveawayActions } from "@/components/admin/giveaway-actions";
import { StatusBadge } from "@/components/status-badge";

export const dynamic = "force-dynamic";

export default async function AdminGiveawaysPage() {
  await closeExpiredGiveaways();

  const giveaways = await prisma.giveaway.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: { select: { entries: true, winners: true } },
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">All giveaways</h2>
        <Link href="/admin/giveaways/new" className="btn-primary">
          + New giveaway
        </Link>
      </div>

      {giveaways.length === 0 && (
        <div className="card p-8 text-center text-sm text-fog">No giveaways yet. Create the first one!</div>
      )}

      <div className="space-y-3">
        {giveaways.map((g) => (
          <div key={g.id} className="card p-5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <Link href={`/admin/giveaways/${g.id}`} className="font-display font-semibold hover:text-leaf">
                  {g.title}
                </Link>
                <p className="mt-1 text-xs text-fog">
                  🏆 {g.prize} · {g._count.entries} entries · {g._count.winners}/{g.winnersCount} winners drawn ·
                  ends {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(g.endsAt)}
                </p>
              </div>
              <StatusBadge active={g.status === "ACTIVE"} />
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-line pt-4">
              <Link href={`/admin/giveaways/${g.id}`} className="btn-ghost">
                Edit & participants
              </Link>
              <GiveawayActions giveawayId={g.id} status={g.status} hasWinners={g._count.winners > 0} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
