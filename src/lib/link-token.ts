import { createHmac, timingSafeEqual } from "crypto";

/**
 * Signed, short-lived "link intent" values. When a logged-in user asks to
 * connect a Discord/Roblox account, we set this in an httpOnly cookie before
 * redirecting into the OAuth flow. The OAuth callback then links the external
 * account to this user instead of creating/logging into a separate account.
 *
 * Format: "<userId>.<expiresAtMs>.<hmacSha256>"
 */

const COOKIE_NAME = "gag2_link_intent";
const TTL_MS = 10 * 60 * 1000; // 10 minutes

function secret(): string {
  const s = process.env.AUTH_SECRET;
  if (!s) throw new Error("AUTH_SECRET is not set");
  return s;
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export const LINK_INTENT_COOKIE = COOKIE_NAME;

/** Creates a signed link-intent value for the given user. */
export function createLinkIntent(userId: string): { value: string; maxAgeSeconds: number } {
  const exp = Date.now() + TTL_MS;
  const payload = `${userId}.${exp}`;
  return { value: `${payload}.${sign(payload)}`, maxAgeSeconds: Math.floor(TTL_MS / 1000) };
}

/** Verifies a link-intent value; returns the userId or null. */
export function verifyLinkIntent(value: string | undefined | null): string | null {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [userId, expStr, sig] = parts as [string, string, string];

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;

  const expected = sign(`${userId}.${expStr}`);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  return userId;
}
