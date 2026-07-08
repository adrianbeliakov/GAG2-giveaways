import { headers, cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { audit } from "@/lib/audit";
import { verifyLinkIntent, LINK_INTENT_COOKIE } from "@/lib/link-token";
import type { User } from "@prisma/client";

export type OAuthProviderId = "discord" | "roblox";

type NormalizedProfile = {
  /** Preferred display/username from the provider. */
  username?: string | null;
  /** Email if the provider supplies one (Discord). Roblox supplies none. */
  email?: string | null;
  /** Whether the provider vouches for the email (Discord `verified`). */
  emailVerified?: boolean;
};

/** Best-effort client IP inside an Auth.js callback (fraud signal only). */
function requestIp(): string | null {
  try {
    const h = headers();
    const xff = h.get("x-forwarded-for");
    if (xff) return xff.split(",")[0]!.trim();
    return h.get("x-real-ip");
  } catch {
    return null;
  }
}

/** Reads (and consumes) a pending link-intent cookie, if any. */
function pendingLinkUserId(): string | null {
  try {
    const jar = cookies();
    const value = jar.get(LINK_INTENT_COOKIE)?.value;
    const userId = verifyLinkIntent(value);
    if (value) {
      // Best-effort single-use: clear it whether valid or not.
      try {
        jar.delete(LINK_INTENT_COOKIE);
      } catch {
        /* read-only context; the 10-minute expiry still bounds it */
      }
    }
    return userId;
  } catch {
    return null;
  }
}

/** Derives a valid, unique username from a provider profile. */
async function uniqueUsername(preferred: string | null | undefined): Promise<string> {
  let base = (preferred ?? "").replace(/[^a-zA-Z0-9_]/g, "").slice(0, 20);
  if (base.length < 3) base = `player${Math.floor(1000 + Math.random() * 9000)}`;

  let candidate = base;
  for (let i = 0; i < 20; i++) {
    const exists = await prisma.user.findUnique({ where: { username: candidate } });
    if (!exists) return candidate;
    const suffix = String(Math.floor(100 + Math.random() * 900));
    candidate = `${base.slice(0, 20 - 1 - suffix.length)}_${suffix}`;
  }
  return `player_${Date.now().toString(36)}`;
}

/**
 * Finds or creates the local user for an external sign-in.
 *
 * Resolution order:
 * 1. A pending "link intent" (set from the profile page) attaches this
 *    external account to the CURRENT logged-in user — never creating or
 *    switching to another account.
 * 2. An existing (provider, providerAccountId) link wins.
 * 3. A Discord profile with a provider-verified email that matches an
 *    existing account is linked to that account (and verifies its email).
 * 4. Otherwise a new user is created.
 *
 * Verification policy:
 * - Discord: `emailVerified` mirrors Discord's own email verification.
 * - Roblox: no email exists, but the identity is a real, authenticated Roblox
 *   account — exactly the audience of this site — so the account is treated
 *   as verified and may enter giveaways. (Their Roblox identity is also what
 *   prize delivery needs.) Linking a Roblox account therefore also verifies
 *   a previously unverified user.
 */
export async function ensureOAuthUser(
  provider: OAuthProviderId,
  providerAccountId: string,
  profile: NormalizedProfile
): Promise<User> {
  const ip = requestIp();

  const existingLink = await prisma.oAuthAccount.findUnique({
    where: { provider_providerAccountId: { provider, providerAccountId } },
    include: { user: true },
  });

  // ---- 1. Link-intent flow: attach to the current user. ----
  const linkUserId = pendingLinkUserId();
  if (linkUserId) {
    const intendedUser = await prisma.user.findUnique({ where: { id: linkUserId } });

    if (intendedUser) {
      if (existingLink) {
        // Already linked. To the same user: nothing to do. To a DIFFERENT
        // user: refuse to steal it — stay signed in as the intended user so
        // the session never switches unexpectedly.
        return existingLink.user.id === intendedUser.id ? existingLink.user : intendedUser;
      }

      await prisma.oAuthAccount.create({
        data: { provider, providerAccountId, userId: intendedUser.id },
      });

      // Linking a real Roblox identity verifies the account (site policy —
      // matches how Roblox-first signups are treated).
      const user =
        provider === "roblox" && !intendedUser.emailVerified
          ? await prisma.user.update({
              where: { id: intendedUser.id },
              data: { emailVerified: new Date() },
            })
          : intendedUser;

      await audit({
        action: "OAUTH_ACCOUNT_LINKED",
        actorId: user.id,
        targetType: "user",
        targetId: user.id,
        ip: ip ?? undefined,
        metadata: { provider, via: "profile_connect" },
      });

      return user;
    }
    // Intent for a user that no longer exists: fall through to normal flow.
  }

  // ---- 2. Existing link wins. ----
  if (existingLink) return existingLink.user;

  const email = profile.email?.toLowerCase() ?? null;

  // ---- 3. Link to an existing account when the provider vouches for the email. ----
  if (email && profile.emailVerified) {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      await prisma.oAuthAccount.create({
        data: { provider, providerAccountId, userId: existingUser.id },
      });
      const user = existingUser.emailVerified
        ? existingUser
        : await prisma.user.update({
            where: { id: existingUser.id },
            data: { emailVerified: new Date() },
          });
      await audit({
        action: "OAUTH_ACCOUNT_LINKED",
        actorId: user.id,
        targetType: "user",
        targetId: user.id,
        ip: ip ?? undefined,
        metadata: { provider },
      });
      return user;
    }
  }

  // ---- 4. Brand-new user. ----
  const username = await uniqueUsername(profile.username);
  const verified = provider === "roblox" || (Boolean(email) && profile.emailVerified === true);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash: null,
      emailVerified: verified ? new Date() : null,
      registrationIp: ip,
    },
  });

  await prisma.oAuthAccount.create({
    data: { provider, providerAccountId, userId: user.id },
  });

  await audit({
    action: "USER_REGISTERED",
    actorId: user.id,
    targetType: "user",
    targetId: user.id,
    ip: ip ?? undefined,
    metadata: { provider },
  });

  // Same suspicious-signup signal as email registration (manual review only).
  if (ip) {
    const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const sameIpCount = await prisma.user.count({
      where: { registrationIp: ip, createdAt: { gte: dayAgo } },
    });
    if (sameIpCount >= 3) {
      await audit({
        action: "SUSPICIOUS_SIGNUP_BURST",
        targetType: "user",
        targetId: user.id,
        ip,
        metadata: { accountsFromIpLast24h: sameIpCount, provider },
      });
    }
  }

  return user;
}

/** True when the user has a linked Roblox account (required to enter giveaways). */
export async function hasRobloxLinked(userId: string): Promise<boolean> {
  const link = await prisma.oAuthAccount.findFirst({
    where: { userId, provider: "roblox" },
    select: { id: true },
  });
  return Boolean(link);
}
