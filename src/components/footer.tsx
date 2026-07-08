import Link from "next/link";
import { Logo } from "@/components/logo";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-line bg-soil/60">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-4 py-12 sm:grid-cols-3">
        <div>
          <Link href="/" className="flex items-center gap-2.5 font-display text-lg font-bold">
            <Logo className="h-8 w-8" />
            <span>
              GAG2 <span className="text-leaf">Giveaways</span>
            </span>
          </Link>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-fog">
            Free community giveaways for Grow a Garden 2. One click to enter,
            winners drawn at random and published for everyone to see.
          </p>
        </div>

        <div>
          <p className="label">Explore</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/" className="text-fog transition hover:text-leaf">
                Active giveaways
              </Link>
            </li>
            <li>
              <Link href="/winners" className="text-fog transition hover:text-leaf">
                Past winners
              </Link>
            </li>
            <li>
              <Link href="/leaderboard" className="text-fog transition hover:text-leaf">
                Leaderboard
              </Link>
            </li>
            <li>
              <Link href="/register" className="text-fog transition hover:text-leaf">
                Create an account
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <p className="label">Legal</p>
          <ul className="mt-3 space-y-2 text-sm">
            <li>
              <Link href="/terms" className="text-fog transition hover:text-leaf">
                Terms of Service
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-fog transition hover:text-leaf">
                Privacy Policy
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line/60 py-5">
        <p className="mx-auto max-w-6xl px-4 text-center text-xs leading-relaxed text-fog/80">
          Winners are drawn randomly from verified entries. No purchase necessary — entries are
          always free. GAG2 Giveaways is a fan-made community site and is not endorsed by or
          affiliated with Roblox Corporation or Discord Inc.
        </p>
      </div>
    </footer>
  );
}
