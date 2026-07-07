import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/validation";
import { createAuthToken } from "@/lib/tokens";
import { sendPasswordResetEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { getClientIp, isSameOrigin } from "@/lib/ip";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);
  const rl = await rateLimit(`forgot:${ip}`, 5, 3600);
  if (!rl.ok) {
    return NextResponse.json({ error: "Too many requests. Try again later." }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const user = await prisma.user.findUnique({ where: { email } });

  // Always answer the same way – no account enumeration.
  if (user) {
    const token = await createAuthToken(email, "PASSWORD_RESET", 60);
    const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    await sendPasswordResetEmail(email, `${base}/reset-password?token=${token}`);
  }

  return NextResponse.json({ ok: true });
}
