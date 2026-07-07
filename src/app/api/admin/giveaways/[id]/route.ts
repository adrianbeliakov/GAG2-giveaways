import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { giveawaySchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { getClientIp, isSameOrigin } from "@/lib/ip";

type Params = { params: { id: string } };

/** Edit a giveaway (admin only). */
export async function PATCH(req: Request, { params }: Params) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = giveawaySchema.partial().safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const existing = await prisma.giveaway.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });

  // If the deadline is moved into the future, the giveaway can be reopened.
  const data: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.endsAt && parsed.data.endsAt > new Date() && existing.status === "ENDED") {
    data.status = "ACTIVE";
    data.endedAt = null;
  }

  const giveaway = await prisma.giveaway.update({ where: { id: params.id }, data });

  await audit({
    action: "GIVEAWAY_UPDATED",
    actorId: admin.id,
    targetType: "giveaway",
    targetId: giveaway.id,
    ip: getClientIp(req),
    metadata: { fields: Object.keys(parsed.data) },
  });

  return NextResponse.json({ ok: true });
}

/** Delete a giveaway and its entries (admin only). */
export async function DELETE(req: Request, { params }: Params) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const existing = await prisma.giveaway.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });

  await prisma.giveaway.delete({ where: { id: params.id } });

  await audit({
    action: "GIVEAWAY_DELETED",
    actorId: admin.id,
    targetType: "giveaway",
    targetId: params.id,
    ip: getClientIp(req),
    metadata: { title: existing.title },
  });

  return NextResponse.json({ ok: true });
}
