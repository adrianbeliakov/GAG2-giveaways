import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// Edge middleware: fast routing gate based on the session JWT.
// All admin data access is ALSO verified against the database in requireAdmin().
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = Boolean(req.auth?.user?.id);

  if (nextUrl.pathname.startsWith("/admin")) {
    if (!isLoggedIn) {
      return NextResponse.redirect(new URL("/login?next=/admin", nextUrl));
    }
    if (req.auth?.user?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/", nextUrl));
    }
  }

  if (nextUrl.pathname.startsWith("/profile") && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login?next=/profile", nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
};
