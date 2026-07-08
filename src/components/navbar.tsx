import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import { Logo } from "@/components/logo";

export async function Navbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-line/80 bg-ink/70 backdrop-blur-xl">
      {/* Hairline glow under the navbar */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(110,231,160,0.35), transparent)",
        }}
        aria-hidden
      />
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link
          href="/"
          className="group flex items-center gap-2.5 font-display text-lg font-bold"
        >
          <span className="transition-transform duration-300 group-hover:rotate-6">
            <Logo className="h-8 w-8" />
          </span>
          <span>
            GAG2 <span className="text-leaf">Giveaways</span>
          </span>
        </Link>

        <div className="flex items-center gap-1 sm:gap-2">
          <Link href="/winners" className="btn-ghost hidden sm:inline-flex">
            Winners
          </Link>
          {user ? (
            <>
              {user.role === "ADMIN" && (
                <Link href="/admin" className="btn-ghost">
                  Admin
                </Link>
              )}
              <Link href="/profile" className="btn-ghost">
                {user.username || "Profile"}
              </Link>
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: "/" });
                }}
              >
                <button type="submit" className="btn-ghost text-fog">
                  Log out
                </button>
              </form>
            </>
          ) : (
            <>
              <Link href="/login" className="btn-ghost">
                Log in
              </Link>
              <Link href="/register" className="btn-primary">
                Sign up
              </Link>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
