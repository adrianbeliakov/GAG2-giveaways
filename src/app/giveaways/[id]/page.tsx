import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { closeExpiredGiveaways } from "@/lib/giveaways";
import { providersForUsers, totalTickets } from "@/lib/entry-weight";
import { Countdown } from "@/components/countdown";
import { StatusBadge } from "@/components/status-badge";
import { EnterButton } from "@/components/enter-button";
import { WinnerClaim } from "@/components/winner-claim";
import { CLAIM_STEPS, DISCORD_INVITE_URL } from "@/lib/claim-config";

export const dynamic = "force-dynamic";

export default async function GiveawayPage({ params }: { params: { id: string } }) {
  await closeExpiredGiveaways();

  const giveaway = await prisma.giveaway.findUnique({
    where: { id: params.id },
    include: {
      _count: { select: { entries: { where: { removed: false } } } },
      winners: { include: { user: { select: { username: true } } }, orderBy: { drawnAt: "asc" } },
    },
  });
  if (!giveaway) notFound();

  const session = await auth();
  let hasEntered = false;
  let isBanned = false;
  let isVerified = false;
  let hasRoblox = false;
  let hasDiscord = false;
  let tickets = 1;

  if (session?.user?.id) {
    const [entry, me, providerMap] = await Promise.all([
      prisma.entry.findUnique({
        where: { giveawayId_userId: { giveawayId: giveaway.id, userId: session.user.id } },
      }),
      prisma.user.findUnique({ where: { id: session.user.id } }),
      providersForUsers([session.user.id]),
    ]);
    const providers = providerMap.get(session.user.id) ?? new Set<string>();
    hasEntered = Boolean(entry && !entry.removed);
    isBanned = Boolean(me?.banned);
    isVerified = Boolean(me?.emailVerified);
    hasRoblox = providers.has("roblox");
    hasDiscord = providers.has("discord");
    tickets = totalTickets(providers);
  }

  const isActive = giveaway.status === "ACTIVE" && giveaway.endsAt > new Date();
  const robloxLoginEnabled = Boolean(
    process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET
  );
  const discordLoginEnabled = Boolean(
    process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
  );

  return (
    <article className="mx-auto max-w-2xl animate-rise">
      <div className="card overflow-hidden p-6 sm:p-8">
        {giveaway.imageUrl && (
          <div className="relative -mx-6 -mt-6 mb-6 aspect-[16/9] overflow-hidden border-b border-line sm:-mx-8 sm:-mt-8">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={giveaway.imageUrl}
              alt={`${giveaway.title} prize`}
              className="h-full w-full object-cover"
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: "linear-gradient(180deg, transparent 55%, rgba(12,18,16,0.55))",
              }}
              aria-hidden
            />
          </div>
        )}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 className="font-display text-2xl font-bold sm:text-3xl">{giveaway.title}</h1>
          <StatusBadge active={isActive} />
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className="chip bg-gold-deep text-gold">🏆 {giveaway.prize}</span>
          <span className="chip border border-line text-fog">
            {giveaway._count.entries} {giveaway._count.entries === 1 ? "entry" : "entries"}
          </span>
          <span className="chip border border-line text-fog">
            {giveaway.winnersCount} {giveaway.winnersCount === 1 ? "winner" : "winners"}
          </span>
        </div>

        <p className="mt-5 whitespace-pre-wrap text-sm leading-relaxed text-fog">
          {giveaway.description}
        </p>

        <div className="mt-6">
          <Countdown
            startsAt={giveaway.createdAt.toISOString()}
            endsAt={giveaway.endsAt.toISOString()}
            ended={!isActive}
          />
          <p className="mt-2 text-xs text-fog">
            {isActive ? "Closes" : "Closed"}{" "}
            {new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(
              giveaway.endedAt ?? giveaway.endsAt
            )}
          </p>
        </div>

        <div className="mt-6 border-t border-line pt-6">
          <EnterButton
            giveawayId={giveaway.id}
            isLoggedIn={Boolean(session?.user?.id)}
            isVerified={isVerified}
            isBanned={isBanned}
            hasEntered={hasEntered}
            isActive={isActive}
            hasRoblox={hasRoblox}
            robloxLoginEnabled={robloxLoginEnabled}
            tickets={tickets}
            hasDiscord={hasDiscord}
            discordLoginEnabled={discordLoginEnabled}
          />
        </div>
      </div>

      {(() => {
        const myWin = session?.user?.id
          ? giveaway.winners.find((w) => w.userId === session.user!.id)
          : undefined;
        return myWin ? (
          <div className="mt-4 animate-rise">
            <WinnerClaim
              winnerId={myWin.id}
              prize={giveaway.prize}
              claimed={Boolean(myWin.claimedAt)}
              steps={CLAIM_STEPS}
              discordInviteUrl={DISCORD_INVITE_URL || undefined}
            />
          </div>
        ) : null;
      })()}

      {giveaway.winners.length > 0 && (
        <div className="card mt-4 border-gold/30 p-6">
          <h2 className="font-display text-lg font-semibold text-gold">
            {giveaway.winners.length === 1 ? "Winner" : "Winners"}
          </h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {giveaway.winners.map((w) => (
              <li key={w.id} className="chip bg-gold-deep text-gold">
                🎉 {w.user.username}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-fog">
            Drawn randomly from all valid entries, weighted by bonus tickets.
          </p>
        </div>
      )}
    </article>
  );
}
