import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/profile");

  const [entered, won, linkedAccounts, recentEntries] = await Promise.all([
    prisma.entry.count({ where: { userId: user.id, removed: false } }),
    prisma.winner.count({ where: { userId: user.id } }),
    prisma.oAuthAccount.findMany({ where: { userId: user.id }, select: { provider: true } }),
    prisma.entry.findMany({
      where: { userId: user.id, removed: false },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { giveaway: { select: { id: true, title: true, status: true, prize: true } } },
    }),
  ]);

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="card p-6 sm:p-8">
        <h1 className="font-display text-2xl font-bold">{user.username}</h1>
        <p className="mt-1 text-sm text-fog">
          {user.email ?? "No email on file"}{" "}
          {user.emailVerified ? (
            <span className="chip ml-1 bg-leaf-deep text-leaf">✓ Verified</span>
          ) : (
            <span className="chip ml-1 bg-gold-deep text-gold">Unverified</span>
          )}
          {linkedAccounts.map((a) => (
            <span key={a.provider} className="chip ml-1 border border-line capitalize text-fog">
              {a.provider}
            </span>
          ))}
        </p>
        <p className="mt-2 text-xs text-fog">
          Member since{" "}
          {new Intl.DateTimeFormat("en", { dateStyle: "long" }).format(user.createdAt)}
        </p>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-line bg-soil p-4 text-center">
            <div className="font-mono text-2xl font-bold text-leaf">{entered}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-fog">Giveaways entered</div>
          </div>
          <div className="rounded-xl border border-line bg-soil p-4 text-center">
            <div className="font-mono text-2xl font-bold text-gold">{won}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-fog">Giveaways won</div>
          </div>
        </div>

        {user.banned && (
          <p className="mt-4 rounded-xl border border-rose/40 bg-rose/10 p-3 text-sm text-rose">
            Your account is currently not eligible to enter giveaways.
          </p>
        )}
      </div>

      <div className="card p-6">
        <h2 className="font-display font-semibold">Recent entries</h2>
        {recentEntries.length === 0 ? (
          <p className="mt-3 text-sm text-fog">
            You haven&apos;t entered any giveaways yet.{" "}
            <Link href="/" className="text-leaf hover:underline">Browse active giveaways</Link>
          </p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {recentEntries.map((e) => (
              <li key={e.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <Link href={`/giveaways/${e.giveaway.id}`} className="hover:text-leaf">
                  {e.giveaway.title}
                </Link>
                <span className="text-xs text-fog">{e.giveaway.status === "ACTIVE" ? "Active" : "Ended"}</span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
