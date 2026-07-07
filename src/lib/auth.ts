import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Discord from "next-auth/providers/discord";
import type { OIDCConfig } from "next-auth/providers";
import type { Provider } from "next-auth/providers";
import { z } from "zod";
import { authConfig } from "@/auth.config";
import { prisma } from "@/lib/prisma";
import { verifyPassword } from "@/lib/password";
import { ensureOAuthUser } from "@/lib/oauth";

/** Roblox OAuth 2.0 / OpenID Connect (create an app at https://create.roblox.com/dashboard/credentials). */
type RobloxProfile = {
  sub: string;
  preferred_username?: string;
  nickname?: string;
  name?: string;
  picture?: string;
};

const Roblox: OIDCConfig<RobloxProfile> = {
  id: "roblox",
  name: "Roblox",
  type: "oidc",
  issuer: "https://apis.roblox.com/oauth/",
  clientId: process.env.ROBLOX_CLIENT_ID,
  clientSecret: process.env.ROBLOX_CLIENT_SECRET,
  authorization: { params: { scope: "openid profile" } },
  checks: ["pkce", "state"],
  profile(p) {
    return {
      id: p.sub,
      name: p.preferred_username ?? p.nickname ?? p.name ?? "roblox_player",
      image: p.picture,
    };
  },
};

const providers: Provider[] = [
  Credentials({
    credentials: { email: {}, password: {} },
    async authorize(credentials) {
      const parsed = z
        .object({ email: z.string().email(), password: z.string().min(1) })
        .safeParse(credentials);
      if (!parsed.success) return null;

      const user = await prisma.user.findUnique({
        where: { email: parsed.data.email.toLowerCase() },
      });
      // Accounts created via Discord/Roblox have no password. They can add one
      // later through the password-reset flow (if they have an email).
      if (!user?.passwordHash) return null;

      const ok = await verifyPassword(parsed.data.password, user.passwordHash);
      if (!ok) return null;

      // Unverified users may log in (to resend verification) but cannot
      // enter giveaways – enforced server-side in the entry endpoint.
      return {
        id: user.id,
        email: user.email,
        name: user.username,
        username: user.username,
        role: user.role,
        emailVerified: user.emailVerified,
      } as never;
    },
  }),
];

// External sign-in providers are enabled only when configured.
if (process.env.DISCORD_CLIENT_ID && process.env.DISCORD_CLIENT_SECRET) {
  providers.push(
    Discord({
      clientId: process.env.DISCORD_CLIENT_ID,
      clientSecret: process.env.DISCORD_CLIENT_SECRET,
      authorization: { params: { scope: "identify email" } },
    })
  );
}
if (process.env.ROBLOX_CLIENT_ID && process.env.ROBLOX_CLIENT_SECRET) {
  providers.push(Roblox);
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers,
  callbacks: {
    ...authConfig.callbacks,

    /**
     * Extends the edge-safe jwt callback with database access (Node runtime):
     * on a Discord/Roblox sign-in, find or create the local user and put its
     * id/role into the token.
     */
    async jwt({ token, user, account, profile }) {
      // Credentials sign-in: `user` is already the database user.
      if (account?.provider === "credentials" && user) {
        const u = user as unknown as {
          id: string;
          username: string;
          role: "USER" | "ADMIN";
          emailVerified: Date | null;
        };
        token.id = u.id;
        token.username = u.username;
        token.role = u.role;
        token.verified = Boolean(u.emailVerified);
        return token;
      }

      // External sign-in: provision or link the local account.
      if (account && (account.provider === "discord" || account.provider === "roblox")) {
        const p = (profile ?? {}) as Record<string, unknown>;
        const dbUser = await ensureOAuthUser(account.provider, account.providerAccountId, {
          username:
            account.provider === "discord"
              ? ((p.global_name ?? p.username) as string | undefined)
              : ((p.preferred_username ?? p.nickname ?? p.name) as string | undefined),
          email: account.provider === "discord" ? ((p.email as string | null) ?? null) : null,
          emailVerified: account.provider === "discord" ? p.verified === true : false,
        });
        token.id = dbUser.id;
        token.username = dbUser.username;
        token.role = dbUser.role;
        token.verified = Boolean(dbUser.emailVerified);
        return token;
      }

      return token;
    },
  },
});
