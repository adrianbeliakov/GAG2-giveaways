import { NextResponse } from "next/server";
import { closeExpiredGiveaways } from "@/lib/giveaways";

export const dynamic = "force-dynamic";

/**
 * Vercel Cron target (see vercel.json). Protected by CRON_SECRET:
 * Vercel sends `Authorization: Bearer <CRON_SECRET>` automatically.
 */
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const closed = await closeExpiredGiveaways();
  return NextResponse.json({ ok: true, closed });
}
