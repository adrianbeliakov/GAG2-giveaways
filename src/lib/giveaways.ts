import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";
import { providersForUsers, totalTickets } from "@/lib/entry-weight";

/**
 * Closes every giveaway whose deadline has passed. Called by the Vercel cron
 * job and lazily before rendering listings, so status is always accurate even
 * between cron runs.
 */
export async function closeExpiredGiveaways() {
  const now = new Date();
  const result = await prisma.giveaway.updateMany({
    where: { status: "ACTIVE", endsAt: { lte: now } },
    data: { status: "ENDED", endedAt: now },
  });
  return result.count;
}

/**
 * Cryptographically fair, ticket-weighted winner selection.
 *
 * - Only valid entries count: not soft-removed, and the user is not banned.
 * - Each entry is worth 1 base ticket + live bonus tickets from connected
 *   accounts (see src/lib/entry-weight.ts). More tickets = proportionally
 *   higher chance; every ticket has an identical chance.
 * - Selection is WITHOUT replacement (a user can win at most once per draw),
 *   driven by crypto.randomInt (CSPRNG), so the draw cannot be predicted.
 */
export async function drawWinners(giveawayId: string, count: number) {
  const validEntries = await prisma.entry.findMany({
    where: {
      giveawayId,
      removed: false,
      user: { banned: false },
    },
    select: { userId: true },
  });

  const userIds = validEntries.map((e) => e.userId);
  const providerMap = await providersForUsers(userIds);

  // Candidate pool: one row per user with their live ticket count.
  const pool = userIds.map((userId) => ({
    userId,
    tickets: totalTickets(providerMap.get(userId) ?? new Set()),
  }));

  const selected: string[] = [];
  const draws = Math.min(count, pool.length);

  for (let d = 0; d < draws; d++) {
    const total = pool.reduce((sum, p) => sum + p.tickets, 0);
    // Pick a ticket uniformly at random, then find its owner.
    let r = randomInt(total); // 0 .. total-1
    let index = 0;
    while (r >= pool[index]!.tickets) {
      r -= pool[index]!.tickets;
      index++;
    }
    selected.push(pool[index]!.userId);
    pool.splice(index, 1); // without replacement
  }

  await prisma.$transaction([
    prisma.winner.deleteMany({ where: { giveawayId } }), // allow a clean re-draw
    prisma.winner.createMany({
      data: selected.map((userId) => ({ giveawayId, userId })),
    }),
  ]);

  return selected;
}
