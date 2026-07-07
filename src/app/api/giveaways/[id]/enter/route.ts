import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/guards";
import { getClientIp, isSameOrigin } from "@/lib/ip";
import { rateLimit } from "@/lib/rate-limit";
import { audit } from "@/lib/audit";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  // Always re-read the user from the database (bans apply immediately).
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in to enter giveaways" }, { status: 401 });
  }
  if (user.banned) {
    return NextResponse.json(
      { error: "Your account is not eligible to enter giveaways." },
      { status: 403 }
    );
  }
  if (!user.emailVerified) {
    return NextResponse.json(
      { error: "Verify your email before entering giveaways." },
      { status: 403 }
    );
  }

  const rl = await rateLimit(`enter:${user.id}`, 20, 60);
  if (!rl.ok) {
    return NextResponse.json({ error: "Slow down a little and try again." }, { status: 429 });
  }

  const giveaway = await prisma.giveaway.findUnique({ where: { id: params.id } });
  if (!giveaway) {
    return NextResponse.json({ error: "Giveaway not found" }, { status: 404 });
  }
  if (giveaway.status !== "ACTIVE" || giveaway.endsAt <= new Date()) {
    return NextResponse.json({ error: "This giveaway has ended." }, { status: 409 });
  }

  const ip = getClientIp(req);

  try {
    // The @@unique([giveawayId, userId]) constraint guarantees one entry per
    // user even under concurrent requests.
    const entry = await prisma.entry.create({
      data: { giveawayId: giveaway.id, userId: user.id, ip },
    });

    await audit({
      action: "ENTRY_CREATED",
      actorId: user.id,
      targetType: "entry",
      targetId: entry.id,
      ip,
      metadata: { giveawayId: giveaway.id },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return NextResponse.json({ error: "You're already in this giveaway." }, { status: 409 });
    }
    throw e;
  }
}
