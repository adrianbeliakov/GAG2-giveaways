import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/validation";
import { consumeAuthToken } from "@/lib/tokens";
import { hashPassword } from "@/lib/password";
import { audit } from "@/lib/audit";
import { getClientIp, isSameOrigin } from "@/lib/ip";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  const email = await consumeAuthToken(parsed.data.token, "PASSWORD_RESET");
  if (!email) {
    return NextResponse.json(
      { error: "This reset link is invalid or has expired." },
      { status: 400 }
    );
  }

  const user = await prisma.user.update({
    where: { email },
    data: { passwordHash: await hashPassword(parsed.data.password) },
  });

  await audit({
    action: "PASSWORD_RESET",
    actorId: user.id,
    targetType: "user",
    targetId: user.id,
    ip: getClientIp(req),
  });

  return NextResponse.json({ ok: true });
}
