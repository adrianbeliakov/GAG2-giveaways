import { prisma } from "@/lib/prisma";
import { UserBanButton } from "@/components/admin/user-actions";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? "";

  const users = await prisma.user.findMany({
    where: q
      ? {
          OR: [
            { username: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { registrationIp: q },
          ],
        }
      : undefined,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { _count: { select: { entries: true, wins: true } } },
  });

  return (
    <div className="space-y-4">
      <form className="flex gap-2" action="/admin/users" method="get">
        <input
          type="search"
          name="q"
          defaultValue={q}
          placeholder="Search by username, email or exact registration IP…"
          className="input max-w-md"
        />
        <button type="submit" className="btn-ghost">Search</button>
      </form>

      <div className="card overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider text-fog">
              <th className="p-4">User</th>
              <th className="p-4">Joined</th>
              <th className="p-4">Reg. IP</th>
              <th className="p-4">Entries</th>
              <th className="p-4">Wins</th>
              <th className="p-4">Status</th>
              <th className="p-4">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {users.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-fog">No users found.</td>
              </tr>
            )}
            {users.map((u) => (
              <tr key={u.id}>
                <td className="p-4">
                  <div className="font-semibold">
                    {u.username}
                    {u.role === "ADMIN" && <span className="chip ml-2 bg-leaf-deep text-leaf">admin</span>}
                  </div>
                  <div className="text-xs text-fog">
                    {u.email ?? "no email"} {u.emailVerified ? "✓" : "(unverified)"}
                  </div>
                </td>
                <td className="p-4 text-xs text-fog">
                  {new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(u.createdAt)}
                </td>
                <td className="p-4 font-mono text-xs">{u.registrationIp ?? "—"}</td>
                <td className="p-4">{u._count.entries}</td>
                <td className="p-4">{u._count.wins}</td>
                <td className="p-4">
                  {u.banned ? (
                    <span className="chip bg-rose/10 text-rose" title={u.banReason ?? undefined}>banned</span>
                  ) : (
                    <span className="chip bg-leaf-deep text-leaf">active</span>
                  )}
                </td>
                <td className="p-4">
                  {u.role !== "ADMIN" && <UserBanButton userId={u.id} banned={u.banned} />}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
