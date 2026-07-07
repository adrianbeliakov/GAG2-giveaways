import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { consumeAuthToken } from "@/lib/tokens";
import { audit } from "@/lib/audit";
import { getClientIp } from "@/lib/ip";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const token = typeof body?.token === "string" ? body.token : "";
  if (!token) return NextResponse.json({ error: "Missing token" }, { status: 400 });

  const email = await consumeAuthToken(token, "EMAIL_VERIFY");
  if (!email) {
    return NextResponse.json(
      { error: "This verification link is invalid or has expired." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { email },
    data: { emailVerified: new Date() },
  });

  await audit({
    action: "EMAIL_VERIFIED",
    actorId: user.id,
    targetType: "user",
    targetId: user.id,
    ip: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
