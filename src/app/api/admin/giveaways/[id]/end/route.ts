import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { getClientIp, isSameOrigin } from "@/lib/ip";

/** End a giveaway early (admin only). */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const giveaway = await prisma.giveaway.findUnique({ where: { id: params.id } });
  if (!giveaway) return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  if (giveaway.status === "ENDED") return NextResponse.json({ ok: true });

  await prisma.giveaway.update({
    where: { id: params.id },
    data: { status: "ENDED", endedAt: new Date() },
  });

  await audit({
    action: "GIVEAWAY_ENDED_EARLY",
    actorId: admin.id,
    targetType: "giveaway",
    targetId: params.id,
    ip: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
