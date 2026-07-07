import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/guards";

/** Search users by username or email (admin only). */
export async function GET(req: Request) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      username: true,
      email: true,
      role: true,
      banned: true,
      emailVerified: true,
      registrationIp: true,
      createdAt: true,
      _count: { select: { entries: true, wins: true } },
    },
  });

  return NextResponse.json({ users });
}
