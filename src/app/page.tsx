import { prisma } from "@/lib/prisma";
import { closeExpiredGiveaways } from "@/lib/giveaways";
import { GiveawayCard } from "@/components/giveaway-card";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Lazy close: status is accurate even between cron runs.
  await closeExpiredGiveaways();

  const giveaways = await prisma.giveaway.findMany({
    where: { status: "ACTIVE" },
    orderBy: { endsAt: "asc" },
    include: { _count: { select: { entries: { where: { removed: false } } } } },
  });

  return (
    <div className="space-y-10">
      <section className="pt-6 text-center sm:pt-12">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-leaf">
          Official GAG2 drops
        </p>
        <h1 className="mx-auto mt-3 max-w-2xl font-display text-4xl font-bold leading-tight sm:text-5xl">
          Plant your entry.
          <br />
          <span className="text-leaf">Win the harvest.</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-fog">
          One click to enter, verified accounts only, and every winner drawn at random — then
          published for everyone to see.
        </p>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Active giveaways</h2>
          <Link href="/winners" className="text-sm text-leaf hover:underline">
            Past winners →
          </Link>
        </div>

        {giveaways.length === 0 ? (
          <div className="card p-10 text-center">
            <div className="text-4xl" aria-hidden>🌾</div>
            <p className="mt-3 font-display font-semibold">Nothing growing right now</p>
            <p className="mt-1 text-sm text-fog">
              New giveaways are planted regularly — check back soon.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {giveaways.map((g, i) => (
              <GiveawayCard
                key={g.id}
                index={i}
                g={{
                  id: g.id,
                  title: g.title,
                  description: g.description,
                  prize: g.prize,
                  status: g.status,
                  createdAt: g.createdAt,
                  endsAt: g.endsAt,
                  participants: g._count.entries,
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
