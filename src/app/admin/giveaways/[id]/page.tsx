import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { providersForUsers, totalTickets } from "@/lib/entry-weight";
import { GiveawayForm } from "@/components/admin/giveaway-form";
import { GiveawayActions } from "@/components/admin/giveaway-actions";
import { EntryActions } from "@/components/admin/entry-actions";

export const dynamic = "force-dynamic";

/** Formats a Date as a value for <input type="datetime-local"> in server-local time. */
function toDatetimeLocal(d: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default async function AdminGiveawayDetailPage({ params }: { params: { id: string } }) {
  const giveaway = await prisma.giveaway.findUnique({
    where: { id: params.id },
    include: {
      entries: {
        orderBy: { createdAt: "desc" },
        include: { user: { select: { id: true, username: true, email: true, banned: true } } },
      },
      winners: { include: { user: { select: { username: true } } } },
    },
  });
  if (!giveaway) notFound();

  // Live ticket counts (same source of truth the draw uses).
  const providerMap = await providersForUsers(giveaway.entries.map((e) => e.user.id));

  // Roblox IDs for winners → direct profile links for prize delivery.
  const winnerRobloxLinks = await prisma.oAuthAccount.findMany({
    where: {
      provider: "roblox",
      userId: { in: giveaway.winners.map((w) => w.userId) },
    },
    select: { userId: true, providerAccountId: true },
  });
  const robloxIdByUser = new Map(
    winnerRobloxLinks.map((l) => [l.userId, l.providerAccountId])
  );

  // Highlight IPs used by more than one entry in THIS giveaway (review signal only).
  const ipCounts = new Map<string, number>();
  for (const e of giveaway.entries) {
    if (e.ip) ipCounts.set(e.ip, (ipCounts.get(e.ip) ?? 0) + 1);
  }

  const totalValidTickets = giveaway.entries
    .filter((e) => !e.removed && !e.user.banned)
    .reduce((sum, e) => sum + totalTickets(providerMap.get(e.user.id) ?? new Set()), 0);

  return (
    <div className="space-y-6">
      <div className="card p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-semibold">Edit giveaway</h2>
          <GiveawayActions
            giveawayId={giveaway.id}
            status={giveaway.status}
            hasWinners={giveaway.winners.length > 0}
          />
        </div>
        <GiveawayForm
          initial={{
            id: giveaway.id,
            title: giveaway.title,
            description: giveaway.description,
            prize: giveaway.prize,
            imageUrl: giveaway.imageUrl ?? "",
            startsAt: toDatetimeLocal(giveaway.startsAt),
            endsAt: toDatetimeLocal(giveaway.endsAt),
            winnersCount: giveaway.winnersCount,
          }}
        />
      </div>

      {giveaway.winners.length > 0 && (
        <div className="card border-gold/30 p-6">
          <h2 className="font-display font-semibold text-gold">
            Winners · prize delivery
          </h2>
          <p className="mt-1 text-xs text-fog">
            Open the Roblox profile, send a friend request, deliver in-game. &quot;Received&quot;
            turns green when the winner confirms on the giveaway page.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[480px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-fog">
                  <th className="py-2 pr-4">Winner</th>
                  <th className="py-2 pr-4">Roblox profile</th>
                  <th className="py-2">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {giveaway.winners.map((w) => {
                  const robloxId = robloxIdByUser.get(w.userId);
                  return (
                    <tr key={w.id}>
                      <td className="py-2.5 pr-4 font-semibold">🎉 {w.user.username}</td>
                      <td className="py-2.5 pr-4">
                        {robloxId ? (
                          <a
                            href={`https://www.roblox.com/users/${robloxId}/profile`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-leaf underline"
                          >
                            Open profile ↗
                          </a>
                        ) : (
                          <span className="text-xs text-fog">No Roblox linked</span>
                        )}
                      </td>
                      <td className="py-2.5">
                        {w.claimedAt ? (
                          <span className="chip bg-leaf-deep text-leaf">
                            ✓{" "}
                            {new Intl.DateTimeFormat("en", { dateStyle: "short" }).format(
                              w.claimedAt
                            )}
                          </span>
                        ) : (
                          <span className="chip bg-gold-deep text-gold">Pending</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="card p-6">
        <h2 className="font-display font-semibold">
          Participants ({giveaway.entries.filter((e) => !e.removed).length} valid
          {giveaway.entries.some((e) => e.removed)
            ? `, ${giveaway.entries.filter((e) => e.removed).length} removed`
            : ""}
          ) · {totalValidTickets} tickets in the draw
        </h2>
        <p className="mt-1 text-xs text-fog">
          Tickets = 1 base + bonus for connected accounts, computed live — the draw uses these
          exact numbers. Shared-IP flags are a review signal only; several legitimate players
          can share one network. Removed entries are excluded from draws but kept for the audit
          trail.
        </p>

        {giveaway.entries.length === 0 ? (
          <p className="mt-4 text-sm text-fog">No entries yet.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[680px] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wider text-fog">
                  <th className="py-2 pr-4">User</th>
                  <th className="py-2 pr-4">Tickets</th>
                  <th className="py-2 pr-4">Entered</th>
                  <th className="py-2 pr-4">IP</th>
                  <th className="py-2 pr-4">Flags</th>
                  <th className="py-2">Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {giveaway.entries.map((e) => (
                  <tr key={e.id} className={e.removed ? "opacity-50" : ""}>
                    <td className="py-2.5 pr-4">
                      <div className="font-semibold">{e.user.username}</div>
                      <div className="text-xs text-fog">{e.user.email}</div>
                    </td>
                    <td className="py-2.5 pr-4">
                      <span className="chip bg-leaf-deep text-leaf">
                        🎟 {totalTickets(providerMap.get(e.user.id) ?? new Set())}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 text-xs text-fog">
                      {new Intl.DateTimeFormat("en", { dateStyle: "short", timeStyle: "short" }).format(e.createdAt)}
                    </td>
                    <td className="py-2.5 pr-4 font-mono text-xs">{e.ip ?? "—"}</td>
                    <td className="py-2.5 pr-4 text-xs">
                      {e.user.banned && <span className="chip mr-1 bg-rose/10 text-rose">banned</span>}
                      {e.ip && (ipCounts.get(e.ip) ?? 0) > 1 && (
                        <span className="chip bg-gold-deep text-gold">shared IP ×{ipCounts.get(e.ip)}</span>
                      )}
                      {e.removed && (
                        <span className="chip bg-line/60 text-fog" title={e.removedReason ?? undefined}>
                          removed
                        </span>
                      )}
                    </td>
                    <td className="py-2.5">
                      <EntryActions entryId={e.id} removed={e.removed} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
