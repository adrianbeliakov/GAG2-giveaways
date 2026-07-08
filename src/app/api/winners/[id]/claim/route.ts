import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/guards";
import { getClientIp, isSameOrigin } from "@/lib/ip";
import { audit } from "@/lib/audit";

/**
 * The winner themselves confirms their prize arrived. Idempotent: confirming
 * twice keeps the original timestamp.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const winner = await prisma.winner.findUnique({ where: { id: params.id } });
  // Only the winner can confirm their own prize; don't reveal whether the
  // row exists to anyone else.
  if (!winner || winner.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (!winner.claimedAt) {
    await prisma.winner.update({
      where: { id: winner.id },
      data: { claimedAt: new Date() },
    });
    await audit({
      action: "PRIZE_CLAIM_CONFIRMED",
      actorId: user.id,
      targetType: "giveaway",
      targetId: winner.giveawayId,
      ip: getClientIp(req),
      metadata: { winnerId: winner.id },
    });
  }

  return NextResponse.json({ ok: true });
}
