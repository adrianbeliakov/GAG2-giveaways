import { prisma } from "@/lib/prisma";

/**
 * Fixed-window rate limiter backed by Postgres, so it works across serverless
 * instances without extra infrastructure. Windows are approximate (a rare race
 * can allow one extra request), which is acceptable for abuse throttling.
 *
 * For very high traffic, swap this for Upstash Redis (@upstash/ratelimit)
 * without changing call sites.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<{ ok: boolean; retryAfterSeconds: number }> {
  const now = new Date();
  const resetAt = new Date(now.getTime() + windowSeconds * 1000);

  const existing = await prisma.rateLimit.findUnique({ where: { key } });

  if (!existing || existing.resetAt < now) {
    await prisma.rateLimit.upsert({
      where: { key },
      update: { count: 1, resetAt },
      create: { key, count: 1, resetAt },
    });
    return { ok: true, retryAfterSeconds: 0 };
  }

  if (existing.count >= limit) {
    return {
      ok: false,
      retryAfterSeconds: Math.max(1, Math.ceil((existing.resetAt.getTime() - now.getTime()) / 1000)),
    };
  }

  await prisma.rateLimit.update({
    where: { key },
    data: { count: { increment: 1 } },
  });
  return { ok: true, retryAfterSeconds: 0 };
}
