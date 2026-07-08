import { prisma } from "@/lib/prisma";
import { closeExpiredGiveaways } from "@/lib/giveaways";
import { GiveawayCard } from "@/components/giveaway-card";
import { GardenAmbience } from "@/components/garden-ambience";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  // Lazy close: status is accurate even between cron runs.
  await closeExpiredGiveaways();

  const [giveaways, userCount, entryCount, winnerCount, recentWinners] = await Promise.all([
    prisma.giveaway.findMany({
      where: { status: "ACTIVE" },
      orderBy: { endsAt: "asc" },
      include: { _count: { select: { entries: { where: { removed: false } } } } },
    }),
    prisma.user.count(),
    prisma.entry.count({ where: { removed: false } }),
    prisma.winner.count(),
    prisma.winner.findMany({
      orderBy: { drawnAt: "desc" },
      take: 6,
      include: {
        user: { select: { username: true } },
        giveaway: { select: { id: true, title: true, prize: true } },
      },
    }),
  ]);

  const stats = [
    { value: userCount, label: "Gardeners signed up" },
    { value: entryCount, label: "Entries planted" },
    { value: winnerCount, label: "Winners harvested" },
  ];

  return (
    <div className="space-y-20 sm:space-y-24">
      {/* ============================== HERO ============================== */}
      <section className="relative -mx-4 -mt-8 overflow-hidden px-4 pb-14 pt-16 text-center sm:pb-20 sm:pt-24">
        <GardenAmbience />

        <div className="relative">
          <p className="eyebrow animate-rise-lg">Official GAG2 drops</p>

          <h1
            className="mx-auto mt-4 max-w-3xl animate-rise-lg font-display text-4xl font-bold leading-[1.08] sm:text-6xl"
            style={{ animationDelay: "80ms" }}
          >
            Plant your entry.
            <br />
            <span className="text-bloom">Win the harvest.</span>
          </h1>

          <p
            className="mx-auto mt-5 max-w-xl animate-rise-lg text-base text-fog sm:text-lg"
            style={{ animationDelay: "160ms" }}
          >
            One click to enter, verified accounts only, and every winner drawn at
            random — then published for everyone to see.
          </p>

          <div
            className="mt-8 flex animate-rise-lg flex-wrap items-center justify-center gap-3"
            style={{ animationDelay: "240ms" }}
          >
            <Link href="/register" className="btn-primary px-6 py-3 text-base">
              Start entering — it&apos;s free
            </Link>
            <Link href="#giveaways" className="btn-ghost px-6 py-3 text-base">
              Browse giveaways
            </Link>
          </div>

          <div
            className="mt-8 flex animate-rise-lg flex-wrap items-center justify-center gap-2"
            style={{ animationDelay: "320ms" }}
          >
            <span className="chip border border-line/80 bg-soil/60 text-fog">
              🎲 Provably random draws
            </span>
            <span className="chip border border-line/80 bg-soil/60 text-fog">
              🆓 No purchase, ever
            </span>
            <span className="chip border border-line/80 bg-soil/60 text-fog">
              🏆 Winners always public
            </span>
          </div>
        </div>
      </section>

      {/* ============================== STATS ============================== */}
      <section className="grid gap-4 sm:grid-cols-3">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className="card-lux animate-rise p-6 text-center"
            style={{ animationDelay: `${i * 90}ms` }}
          >
            <p className="font-display text-4xl font-bold text-leaf">
              {new Intl.NumberFormat("en").format(s.value)}
            </p>
            <p className="mt-1 text-sm text-fog">{s.label}</p>
          </div>
        ))}
      </section>

      {/* ============================ GIVEAWAYS ============================ */}
      <section id="giveaways" className="scroll-mt-24">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Live now</p>
            <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
              Active giveaways
            </h2>
          </div>
          <Link href="/winners" className="text-sm text-leaf hover:underline">
            Past winners →
          </Link>
        </div>

        {giveaways.length === 0 ? (
          <div className="card-lux p-12 text-center">
            <div className="inline-block animate-sway text-5xl" aria-hidden>
              🌾
            </div>
            <p className="mt-4 font-display text-lg font-semibold">
              Nothing growing right now
            </p>
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

      {/* ========================= RECENT WINNERS ========================= */}
      {recentWinners.length > 0 && (
        <section>
          <div className="mb-5">
            <p className="eyebrow" style={{ color: "#F2C14E" }}>
              Fresh from the garden
            </p>
            <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
              Recent winners
            </h2>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {recentWinners.map((w, i) => (
              <Link
                key={w.id}
                href={`/giveaways/${w.giveaway.id}`}
                className="card-lux flex animate-rise items-center gap-4 p-4"
                style={{ animationDelay: `${i * 70}ms` }}
              >
                <span
                  className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gold-deep text-lg"
                  aria-hidden
                >
                  🏆
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display font-semibold">
                    {w.user.username}
                  </span>
                  <span className="block truncate text-xs text-fog">
                    won <span className="text-gold">{w.giveaway.prize}</span> ·{" "}
                    {w.giveaway.title}
                  </span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ========================== HOW IT WORKS ========================== */}
      <section>
        <div className="mb-6 text-center">
          <p className="eyebrow">How it works</p>
          <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
            From seed to trophy in three steps
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {[
            {
              icon: "🌱",
              title: "Create your account",
              body: "Sign up with email, Discord, or Roblox in under a minute. Verified accounts keep every draw fair.",
            },
            {
              icon: "🖱️",
              title: "Enter with one click",
              body: "Open any live giveaway and hit Enter. One entry per gardener — bots and duplicates never make it in.",
            },
            {
              icon: "🏆",
              title: "Winners drawn randomly",
              body: "When the countdown ends, winners are picked by a cryptographically secure draw and published for all to see.",
            },
          ].map((s, i) => (
            <div
              key={s.title}
              className="card-lux animate-rise p-6"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-leaf-deep text-xl">
                  {s.icon}
                </span>
                <span className="font-mono text-xs text-fog">STEP {i + 1}</span>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-fog">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* =========================== WHY CHOOSE US ========================= */}
      <section>
        <div className="mb-6 text-center">
          <p className="eyebrow">Why GAG2 Giveaways</p>
          <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
            Built for fairness, grown for the community
          </h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[
            {
              icon: "🎲",
              title: "Provably fair draws",
              body: "Winners are selected with a cryptographically secure random draw over valid entries only — never hand-picked.",
            },
            {
              icon: "👁️",
              title: "Everything public",
              body: "Every ended giveaway shows its winners, entry counts, and dates. Nothing happens behind closed doors.",
            },
            {
              icon: "🛡️",
              title: "Serious anti-cheat",
              body: "Verified accounts, one entry per person, bot protection, and manual fraud review keep the odds honest for everyone.",
            },
            {
              icon: "💚",
              title: "Always free",
              body: "No purchases, no paid entries, no catch. Prizes are delivered directly in Roblox to winners.",
            },
          ].map((f, i) => (
            <div
              key={f.title}
              className="card-lux flex animate-rise gap-4 p-6"
              style={{ animationDelay: `${i * 90}ms` }}
            >
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-leaf-deep text-2xl">
                {f.icon}
              </span>
              <div>
                <h3 className="font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-fog">{f.body}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================================ FAQ =============================== */}
      <section className="mx-auto w-full max-w-3xl">
        <div className="mb-6 text-center">
          <p className="eyebrow">FAQ</p>
          <h2 className="mt-1 font-display text-2xl font-semibold sm:text-3xl">
            Common questions
          </h2>
        </div>
        <div className="space-y-3">
          {[
            {
              q: "Is it really free to enter?",
              a: "Yes — completely. Entries never cost anything and there is nothing to buy. Prizes are funded by the community and delivered in Roblox.",
            },
            {
              q: "How are winners chosen?",
              a: "When a giveaway ends, winners are drawn from the valid entries using a cryptographically secure random shuffle. Removed or banned entries never take part, and results are published publicly.",
            },
            {
              q: "How do I receive my prize?",
              a: "Prizes are in-game items delivered inside Roblox, so winners need a Roblox account we can deliver to. Keep your account connected so we can reach you.",
            },
            {
              q: "Can I enter more than once?",
              a: "One entry per person per giveaway. Duplicate accounts and bots are blocked, and suspicious entries are reviewed and removed to keep the draw fair for everyone.",
            },
            {
              q: "Which login methods can I use?",
              a: "Email, Discord, or Roblox — whichever is easiest for you. You can use any of them to create your account and enter giveaways.",
            },
          ].map((f) => (
            <details key={f.q} className="faq-item">
              <summary>{f.q}</summary>
              <div className="faq-body">{f.a}</div>
            </details>
          ))}
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="relative overflow-hidden rounded-3xl border border-line bg-soil p-10 text-center sm:p-14">
        <div
          className="pointer-events-none absolute inset-0 animate-glow-pulse"
          style={{
            background:
              "radial-gradient(600px 220px at 50% 0%, rgba(110,231,160,0.14), transparent 70%)",
          }}
          aria-hidden
        />
        <div className="relative">
          <h2 className="font-display text-2xl font-bold sm:text-4xl">
            Your next prize is <span className="text-bloom">already growing</span>
          </h2>
          <p className="mx-auto mt-3 max-w-md text-fog">
            Join the garden in under a minute and enter your first giveaway today.
          </p>
          <Link href="/register" className="btn-primary mt-7 px-7 py-3 text-base">
            Create my free account
          </Link>
        </div>
      </section>
    </div>
  );
}
