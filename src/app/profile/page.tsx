import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";
import { providersForUsers, totalTickets } from "@/lib/entry-weight";
import { ConnectAccountButton } from "@/components/connect-account-button";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const [entered, won, providerMap, recentEntries] = await Promise.all([
    prisma.entry.count({ where: { userId: user.id, removed: false } }),
    prisma.winner.count({ where: { userId: user.id } }),
    providersForUsers([user.id]),
    prisma.entry.findMany({
      where: { userId: user.id, removed: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { giveaway: { select: { id: true, title: true, status: true, prize: true } } },
    }),
  ]);

  const providers = providerMap.get(user.id) ?? new Set<string>();
  const hasRoblox = providers.has("roblox");
  const hasDiscord = providers.has("discord");
  const tickets = totalTickets(providers);
  const maxTickets = 4; // base 1 + both-connected bonus 3

  const discordEnabled = Boolean(
    process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET
  );
  const robloxEnabled = Boolean(
    process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET
  );

  // Extra tickets a connection would add right now (both-bonus makes Discord
  // worth +2 once Roblox is linked). Built without Set spread for es5 targets.
  const withProvider = (extra: string) => {
    const s = new Set<string>();
    providers.forEach((p) => s.add(p));
    s.add(extra);
    return s;
  };
  const discordGain = totalTickets(withProvider("discord")) - tickets;
  const robloxGain = totalTickets(withProvider("roblox")) - tickets;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold">{user.username}</h1>
        <p className="mt-1 text-sm text-fog">
          {user.email ?? "No email on file"}{" "}
          {user.emailVerified ? (
            <span className="chip ml-1 bg-leaf-deep text-leaf">✓ Verified</span>
          ) : (
            <span className="chip ml-1 bg-gold-deep text-gold">Unverified</span>
          )}
        </p>
        <p className="mt-2 text-xs text-fog">
          Member since{" "}
          {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(user.createdAt)}
        </p>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <div className="rounded-xl border border-line bg-soil p-4 text-center">
            <div className="font-mono text-2xl font-bold text-leaf">{entered}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-fog">Entered</div>
          </div>
          <div className="rounded-xl border border-line bg-soil p-4 text-center">
            <div className="font-mono text-2xl font-bold text-gold">{won}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-fog">Won</div>
          </div>
          <div className="rounded-xl border border-line bg-soil p-4 text-center">
            <div className="font-mono text-2xl font-bold text-leaf">
              {tickets}
              <span className="text-sm text-fog">/{maxTickets}</span>
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-fog">
              Tickets per entry
            </div>
          </div>
        </div>

        {user.banned && (
          <p className="mt-4 rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">
            Your account is currently not eligible to enter giveaways.
          </p>
        )}
      </div>

      {/* ------------------------ Connected accounts ------------------------ */}
      <div className="card p-6">
        <h2 className="font-display font-semibold">Connected accounts</h2>
        <p className="mt-1 text-sm text-fog">
          A connected Roblox account is required to enter giveaways — that&apos;s where prizes
          are delivered. Every connection adds bonus tickets to all your entries.
        </p>

        <ul className="mt-4 space-y-3">
          <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-soil p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-leaf-deep" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-leaf">
                  <path d="M5.16 0 .07 18.84 18.84 24l5.09-18.84L5.16 0Zm9.14 14.62-4.92-1.33 1.33-4.92 4.92 1.33-1.33 4.92Z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold">Roblox</p>
                <p className="text-xs text-fog">
                  Required for prize delivery
                  {!hasRoblox && robloxGain > 0 && ` · +${robloxGain} tickets`}
                </p>
              </div>
            </div>
            {hasRoblox ? (
              <span className="chip bg-leaf-deep text-leaf">✓ Connected</span>
            ) : robloxEnabled ? (
              <ConnectAccountButton provider="roblox" className="btn-primary" />
            ) : (
              <span className="chip border border-line text-fog">Temporarily unavailable</span>
            )}
          </li>

          <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-soil p-4">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-leaf-deep" aria-hidden>
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-leaf">
                  <path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52.07.07 0 0 0-.08.04c-.21.38-.44.87-.6 1.25a18.3 18.3 0 0 0-5.5 0 12.6 12.6 0 0 0-.61-1.25.08.08 0 0 0-.08-.04 19.7 19.7 0 0 0-4.88 1.52.07.07 0 0 0-.04.03C.53 9.05-.32 13.58.1 18.06c0 .02.01.04.03.05a19.9 19.9 0 0 0 6 3.03.08.08 0 0 0 .08-.03c.46-.63.87-1.3 1.22-2a.08.08 0 0 0-.04-.1 13 13 0 0 1-1.87-.9.08.08 0 0 1 0-.12l.36-.29a.07.07 0 0 1 .08 0 14.2 14.2 0 0 0 12.06 0 .07.07 0 0 1 .08 0l.37.29a.08.08 0 0 1-.01.13c-.6.35-1.22.64-1.87.88a.08.08 0 0 0-.04.11c.36.7.77 1.36 1.22 1.99a.08.08 0 0 0 .08.03 19.8 19.8 0 0 0 6.02-3.03.08.08 0 0 0 .03-.05c.5-5.18-.84-9.67-3.55-13.66a.06.06 0 0 0-.03-.03ZM8.02 15.33c-1.18 0-2.16-1.08-2.16-2.42 0-1.33.96-2.42 2.16-2.42 1.21 0 2.18 1.1 2.16 2.42 0 1.34-.96 2.42-2.16 2.42Zm7.97 0c-1.18 0-2.15-1.08-2.15-2.42 0-1.33.95-2.42 2.15-2.42 1.22 0 2.18 1.1 2.16 2.42 0 1.34-.94 2.42-2.16 2.42Z" />
                </svg>
              </span>
              <div>
                <p className="text-sm font-semibold">Discord</p>
                <p className="text-xs text-fog">
                  {hasDiscord
                    ? "Boosting all your entries"
                    : discordGain > 0
                      ? `+${discordGain} bonus tickets on every entry`
                      : "Community perks"}
                </p>
              </div>
            </div>
            {hasDiscord ? (
              <span className="chip bg-leaf-deep text-leaf">✓ Connected</span>
            ) : discordEnabled ? (
              <ConnectAccountButton provider="discord" className="btn-ghost" />
            ) : (
              <span className="chip border border-line text-fog">Temporarily unavailable</span>
            )}
          </li>

          <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-soil p-4 opacity-70">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-lg bg-line/50 text-lg" aria-hidden>
                📱
              </span>
              <div>
                <p className="text-sm font-semibold">Phone number</p>
                <p className="text-xs text-fog">Extra bonus tickets for verified numbers</p>
              </div>
            </div>
            <span className="chip border border-line text-fog">Coming soon</span>
          </li>
        </ul>
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold">Recent entries</h2>
        {recentEntries.length === 0 ? (
          <p className="mt-3 text-sm text-fog">
            You haven&apos;t entered any giveaways yet.{" "}
            <Link href="/" className="text-leaf hover:underline">
              Browse active giveaways
            </Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recentEntries.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <Link href={`/giveaways/${e.giveaway.id}`} className="hover:text-leaf">
                  {e.giveaway.title}
                </Link>
                <span className="text-xs text-fog">
                  {e.giveaway.status === "ACTIVE" ? "Active" : "Ended"}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
