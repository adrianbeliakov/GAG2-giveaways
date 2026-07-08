import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { drawWinners } from "@/lib/giveaways";
import { announceWinners } from "@/lib/discord-webhook";
import { audit } from "@/lib/audit";
import { getClientIp, isSameOrigin } from "@/lib/ip";

/**
 * Draw random winners (admin only). Ends the giveaway first if still active,
 * then selects `winnersCount` winners fairly from valid entries only
 * (not removed, user not banned) using a ticket-weighted CSPRNG draw.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const giveaway = await prisma.giveaway.findUnique({ where: { id: params.id } });
  if (!giveaway) return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });

  if (giveaway.status === "ACTIVE") {
    await prisma.giveaway.update({
      where: { id: giveaway.id },
      data: { status: "ENDED", endedAt: new Date() },
    });
  }

  const winnerIds = await drawWinners(giveaway.id, giveaway.winnersCount);

  await audit({
    action: "GIVEAWAY_DRAWN",
    actorId: admin.id,
    targetType: "giveaway",
    targetId: giveaway.id,
    ip: getClientIp(req),
    metadata: { winners: winnerIds, requested: giveaway.winnersCount },
  });

  if (winnerIds.length === 0) {
    return NextResponse.json({ ok: true, winners: 0, message: "No valid entries to draw from." });
  }

  // Announce to Discord (optional, fail-safe — never blocks the draw result).
  const winners = await prisma.user.findMany({
    where: { id: { in: winnerIds } },
    select: { username: true },
  });
  await announceWinners(
    { id: giveaway.id, title: giveaway.title, prize: giveaway.prize, imageUrl: giveaway.imageUrl },
    winners.map((w) => w.username)
  );

  return NextResponse.json({ ok: true, winners: winnerIds.length });
}
