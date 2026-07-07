import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { audit } from "@/lib/audit";
import { getClientIp, isSameOrigin } from "@/lib/ip";
import { z } from "zod";

/**
 * Soft-remove or restore a suspicious entry (admin review). Removed entries
 * stay in the database for the audit trail but never win draws.
 */
export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = z
    .object({ removed: z.boolean(), reason: z.string().trim().max(300).optional() })
    .safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const entry = await prisma.entry.findUnique({ where: { id: params.id } });
  if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

  await prisma.entry.update({
    where: { id: params.id },
    data: {
      removed: parsed.data.removed,
      removedAt: parsed.data.removed ? new Date() : null,
      removedReason: parsed.data.removed ? parsed.data.reason ?? "Removed by admin" : null,
    },
  });

  await audit({
    action: parsed.data.removed ? "ENTRY_REMOVED" : "ENTRY_RESTORED",
    actorId: admin.id,
    targetType: "entry",
    targetId: params.id,
    ip: getClientIp(req),
    metadata: { giveawayId: entry.giveawayId, userId: entry.userId, reason: parsed.data.reason },
  });

  return NextResponse.json({ ok: true });
}
