import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";
import { banSchema } from "@/lib/validation";
import { audit } from "@/lib/audit";
import { getClientIp, isSameOrigin } from "@/lib/ip";

/**
 * Ban or unban a user from future giveaways (admin only).
 * Bans are always a manual admin decision – shared IPs alone never trigger one.
 */
export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) return NextResponse.json({ error: "Invalid origin" }, { status: 403 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json().catch(() => null);
  const parsed = banSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role === "ADMIN") {
    return NextResponse.json({ error: "Admins cannot be banned." }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: params.id },
    data: {
      banned: parsed.data.banned,
      bannedAt: parsed.data.banned ? new Date() : null,
      banReason: parsed.data.banned ? parsed.data.reason ?? null : null,
    },
  });

  await audit({
    action: parsed.data.banned ? "USER_BANNED" : "USER_UNBANNED",
    actorId: admin.id,
    targetType: "user",
    targetId: params.id,
    ip: getClientIp(req),
    metadata: { reason: parsed.data.reason },
  });

  return NextResponse.json({ ok: true });
}
