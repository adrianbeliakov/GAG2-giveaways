/**
 * Best-effort client IP extraction. On Vercel, `x-forwarded-for` is set by the
 * platform and the first entry is the client. Used ONLY as a fraud signal –
 * never as the sole reason to block or ban anyone.
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0]!.trim();
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}

/**
 * CSRF hardening for state-changing JSON endpoints: browsers always send an
 * Origin header on cross-site POSTs, so reject requests whose Origin host
 * doesn't match the Host header. (Auth cookies are also SameSite=Lax.)
 */
export function isSameOrigin(req: Request): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // non-browser clients / same-origin GET
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}
