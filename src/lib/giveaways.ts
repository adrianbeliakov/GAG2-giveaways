import { randomInt } from "crypto";
import { prisma } from "@/lib/prisma";

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
 * Cryptographically fair winner selection.
 * - Only valid entries count: not soft-removed, and the user is not banned.
 * - Uses a Fisher–Yates shuffle driven by crypto.randomInt (CSPRNG), so every
 *   valid entry has an identical chance and the draw cannot be predicted.
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

  const pool = validEntries.map((e) => e.userId);
  // Fisher–Yates with a CSPRNG
  for (let i = pool.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  const selected = pool.slice(0, Math.min(count, pool.length));

  await prisma.$transaction([
    prisma.winner.deleteMany({ where: { giveawayId } }), // allow a clean re-draw
    prisma.winner.createMany({
      data: selected.map((userId) => ({ giveawayId, userId })),
    }),
  ]);

  return selected;
}
