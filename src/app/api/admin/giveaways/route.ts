import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { giveawaySchema } from "@/lib/validation";
import { announceGiveaway } from "@/lib/discord-webhook";
import { audit } from "@/lib/audit";
import { getClientIp, isSameOrigin } from "@/lib/ip";

/** Create a giveaway (admin only). */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = giveawaySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }
  if (parsed.data.endsAt <= new Date()) {
    return NextResponse.json({ error: "End date must be in the future" }, { status: 400 });
  }

  const giveaway = await prisma.giveaway.create({
    data: { ...parsed.data, createdById: admin.id },
  });

  await audit({
    action: "GIVEAWAY_CREATED",
    actorId: admin.id,
    targetType: "giveaway",
    targetId: giveaway.id,
    ip: getClientIp(req),
    metadata: { title: giveaway.title },
  });

  // Announce to Discord (optional, fail-safe — never blocks creation).
  await announceGiveaway({
    id: giveaway.id,
    title: giveaway.title,
    prize: giveaway.prize,
    description: giveaway.description,
    endsAt: giveaway.endsAt,
    startsAt: giveaway.startsAt,
    winnersCount: giveaway.winnersCount,
    imageUrl: giveaway.imageUrl,
  });

  return NextResponse.json({ ok: true, id: giveaway.id });
}
