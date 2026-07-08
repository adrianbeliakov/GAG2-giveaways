import { prisma } from "@/lib/prisma";

/**
 * Bonus tickets — the single source of truth.
 *
 * Every valid entry starts at 1 base ticket. Connected accounts add bonus
 * tickets, computed LIVE from the user's current connections at draw time
 * (and wherever tickets are displayed), so they are never stale:
 *
 *   Roblox connected            → +1 bonus ticket
 *   Discord connected           → +1 bonus ticket
 *   BOTH connected              → +3 bonus tickets total (not +2)
 *
 * Because a linked Roblox account is required to enter at all, every
 * participant holds at least 2 tickets; connecting Discord raises it to 4.
 *
 * Future actions (phone verification, joining Discord servers, daily logins,
 * invites, …) should be added HERE so draws, UI, and admin all stay in sync.
 */
export function bonusTickets(providers: ReadonlySet<string>): number {
  const roblox = providers.has("roblox");
  const discord = providers.has("discord");
  if (roblox && discord) return 3;
  return (roblox ? 1 : 0) + (discord ? 1 : 0);
}

/** Total tickets an entry is worth: 1 base + bonuses. */
export function totalTickets(providers: ReadonlySet<string>): number {
  return 1 + bonusTickets(providers);
}

/** Loads connected providers for many users in one query. */
export async function providersForUsers(
  userIds: string[]
): Promise<Map<string, Set<string>>> {
  const map = new Map<string, Set<string>>();
  if (userIds.length === 0) return map;

  const links = await prisma.oAuthAccount.findMany({
    where: { userId: { in: userIds } },
    select: { userId: true, provider: true },
  });
  for (const l of links) {
    if (!map.has(l.userId)) map.set(l.userId, new Set());
    map.get(l.userId)!.add(l.provider);
  }
  return map;
}

/** Tickets for a single user (1 base + live bonuses). */
export async function ticketsForUser(userId: string): Promise<number> {
  const map = await providersForUsers([userId]);
  return totalTickets(map.get(userId) ?? new Set());
}
