import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      username: string;
      role: "USER" | "ADMIN";
      verified: boolean;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: "USER" | "ADMIN";
    verified?: boolean;
  }
}

// next-auth v5 re-exports its core types from @auth/core, so the callback
// signatures use this module's JWT interface – augment it too.
declare module "@auth/core/jwt" {
  interface JWT {
    id?: string;
    username?: string;
    role?: "USER" | "ADMIN";
    verified?: boolean;
  }
}
