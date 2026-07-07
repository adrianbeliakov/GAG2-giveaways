import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAuthToken } from "@/lib/tokens";
import { sendVerificationEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { isSameOrigin } from "@/lib/ip";

export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }

  const rl = await rateLimit(`resend-verify:${session.user.id}`, 3, 3600);
  if (!rl.ok) {
    return NextResponse.json({ error: "Please wait before requesting another email." }, { status: 429 });
  }

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) return NextResponse.json({ error: "Account not found" }, { status: 404 });
  if (user.emailVerified) return NextResponse.json({ ok: true, alreadyVerified: true });
  if (!user.email) {
    return NextResponse.json(
      { error: "This account has no email address on file." },
      { status: 400 }
    );
  }

  const token = await createAuthToken(user.email, "EMAIL_VERIFY", 24 * 60);
  const base = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  await sendVerificationEmail(user.email, `${base}/verify-email?token=${token}`);

  return NextResponse.json({ ok: true });
}
