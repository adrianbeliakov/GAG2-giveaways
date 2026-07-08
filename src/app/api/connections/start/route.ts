import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/guards";
import { isSameOrigin } from "@/lib/ip";
import { createLinkIntent, LINK_INTENT_COOKIE } from "@/lib/link-token";

/**
 * Arms a short-lived, signed "link intent" cookie for the logged-in user.
 * The client calls this immediately before starting the Discord/Roblox OAuth
 * flow so the callback links the external account to the CURRENT user instead
 * of signing into (or creating) a separate one.
 */
export async function POST(req: Request) {
  if (!isSameOrigin(req)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }

  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first" }, { status: 401 });
  }
  if (user.banned) {
    return NextResponse.json({ error: "Account not eligible" }, { status: 403 });
  }

  const intent = createLinkIntent(user.id);
  cookies().set(LINK_INTENT_COOKIE, intent.value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: intent.maxAgeSeconds,
  });

  return NextResponse.json({ ok: true });
}
