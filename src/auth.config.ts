import type { NextAuthConfig } from "next-auth";

/**
 * Edge-safe Auth.js configuration (no database imports) shared between the
 * middleware and the full Node config in src/lib/auth.ts.
 *
 * Note: the JWT role claim is a fast first gate for routing only. Every admin
 * page and API re-checks the role against the database via requireAdmin().
 */
export const authConfig = {
  pages: { signIn: "/login" },
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  providers: [], // filled in src/lib/auth.ts (Credentials needs Node APIs)
  callbacks: {
    jwt({ token, user }) {
      if (user) {
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
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? "";
        session.user.username = token.username ?? "";
        session.user.role = token.role ?? "USER";
        session.user.verified = token.verified ?? false;
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
