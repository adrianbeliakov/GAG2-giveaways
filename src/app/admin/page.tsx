import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { closeExpiredGiveaways } from "@/lib/giveaways";

export const dynamic = "force-dynamic";

export default async function AdminOverviewPage() {
  await closeExpiredGiveaways();

  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const [users, verifiedUsers, bannedUsers, activeGiveaways, endedGiveaways, entries, newUsers24h] =
    await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { emailVerified: { not: null } } }),
      prisma.user.count({ where: { banned: true } }),
      prisma.giveaway.count({ where: { status: "ACTIVE" } }),
      prisma.giveaway.count({ where: { status: "ENDED" } }),
      prisma.entry.count({ where: { removed: false } }),
      prisma.user.count({ where: { createdAt: { gte: dayAgo } } }),
    ]);

  // Anti-abuse signal: several new accounts from one IP in 24h.
  // This is surfaced for MANUAL review only – shared IPs are often legitimate
  // (families, schools, mobile carriers), so nothing is banned automatically.
  const suspiciousIps = await prisma.user.groupBy({
    by: ["registrationIp"],
    where: { createdAt: { gte: dayAgo }, registrationIp: { not: null } },
    _count: { _all: true },
    having: { registrationIp: { _count: { gte: 3 } } },
    orderBy: { _count: { registrationIp: "desc" } },
    take: 10,
  });

  const stats = [
    { label: "Total users", value: users },
    { label: "Verified users", value: verifiedUsers },
    { label: "New users (24h)", value: newUsers24h },
    { label: "Banned users", value: bannedUsers },
    { label: "Active giveaways", value: activeGiveaways },
    { label: "Ended giveaways", value: endedGiveaways },
    { label: "Valid entries", value: entries },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card p-4">
            <div className="font-mono text-2xl font-bold text-leaf">{s.value}</div>
            <div className="mt-1 text-xs uppercase tracking-wider text-fog">{s.label}</div>
          </div>
        ))}
        <Link href="/admin/giveaways/new" className="card flex items-center justify-center border-dashed p-4 text-sm font-semibold text-leaf hover:border-leaf/50">
          + New giveaway
        </Link>
      </div>

      <div className="card p-5">
        <h2 className="font-display font-semibold">Suspicious signup activity (last 24h)</h2>
        <p className="mt-1 text-xs text-fog">
          IPs with 3+ new accounts, listed for manual review. A shared IP alone is never a reason to
          ban — households, schools and mobile networks share addresses.
        </p>
        {suspiciousIps.length === 0 ? (
          <p className="mt-4 text-sm text-fog">Nothing unusual. 🌿</p>
        ) : (
          <ul className="mt-4 divide-y divide-line text-sm">
            {suspiciousIps.map((row) => (
              <li key={row.registrationIp} className="flex items-center justify-between gap-3 py-2.5">
                <span className="font-mono">{row.registrationIp}</span>
                <span className="flex items-center gap-3">
                  <span className="text-fog">{row._count._all} accounts</span>
                  <Link
                    href={`/admin/users?q=${encodeURIComponent(row.registrationIp ?? "")}`}
                    className="text-leaf hover:underline"
                  >
                    Review →
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
