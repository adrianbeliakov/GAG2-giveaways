import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { registerSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";
import { getClientIp, isSameOrigin } from "@/lib/ip";
import { rateLimit } from "@/lib/rate-limit";
import { verifyTurnstile } from "@/lib/turnstile";
import { createAuthToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { audit } from "@/lib/audit";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const ip = getClientIp(req);

  // Anti-abuse: throttle registrations per IP (burst + hourly).
  const burst = await rateLimit(`register:burst:${ip}`, 3, 60);
  const hourly = await rateLimit(`register:hour:${ip}`, 10, 3600);
  if (!burst.ok || !hourly.ok) {
    return NextResponse.json(
      { error: "Too many sign-up attempts. Please try again later." },
      { status: 429 }
    );
  }

  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 }
    );
  }

  // Anti-abuse: CAPTCHA on registration.
  const human = await verifyTurnstile(parsed.data.captchaToken, ip);
  if (!human) {
    return NextResponse.json({ error: "CAPTCHA verification failed" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase();
  const { username, password } = parsed.data;

  const conflict = await prisma.user.findFirst({
    where: { OR: [{ email }, { username }] },
    select: { email: true, username: true },
  });
  if (conflict) {
    return NextResponse.json(
      {
        error:
          conflict.email === email
            ? "An account with this email already exists"
            : "This username is taken",
      },
      { status: 409 }
    );
  }

  const user = await prisma.user.create({
    data: {
      email,
      username,
      passwordHash: await hashPassword(password),
      registrationIp: ip, // fraud signal only – never the sole ban reason
    },
  });

  await audit({ action: "USER_REGISTERED", actorId: user.id, targetType: "user", targetId: user.id, ip });

  // Anti-abuse: flag (not ban) bursts of new accounts from one IP.
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const sameIpCount = await prisma.user.count({
    where: { registrationIp: ip, createdAt: { gte: dayAgo } },
  });
  if (sameIpCount >= 3 && ip !== "unknown") {
    await audit({
      action: "SUSPICIOUS_SIGNUP_BURST",
      targetType: "user",
      targetId: user.id,
      ip,
      metadata: { accountsFromIpLast24h: sameIpCount },
    });
  }

  // Email verification (required before entering giveaways).
  const token = await createAuthToken(email, "EMAIL_VERIFY", 24 * 60);
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await sendVerificationEmail(email, `${base}/verify-email?token=${token}`);

  return NextResponse.json({ ok: true });
}
