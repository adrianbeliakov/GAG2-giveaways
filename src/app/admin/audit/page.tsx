import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminAuditPage() {
  const logs = await prisma.auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    include: { actor: { select: { username: true } } },
  });

  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[720px] text-left text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase tracking-wider text-fog">
            <th className="p-4">When</th>
            <th className="p-4">Action</th>
            <th className="p-4">Actor</th>
            <th className="p-4">Target</th>
            <th className="p-4">IP</th>
            <th className="p-4">Details</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-line">
          {logs.length === 0 && (
            <tr>
              <td colSpan={6} className="p-6 text-center text-fog">No log entries yet.</td>
            </tr>
          )}
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="p-4 whitespace-nowrap text-xs text-fog">
                {new Intl.DateTimeFormat("en", { dateStyle: "short", timeStyle: "medium" }).format(log.createdAt)}
              </td>
              <td className="p-4">
                <span className="chip border border-line font-mono text-xs">{log.action}</span>
              </td>
              <td className="p-4 text-xs">{log.actor?.username ?? "—"}</td>
              <td className="p-4 text-xs text-fog">
                {log.targetType ? `${log.targetType}:${log.targetId?.slice(0, 8)}…` : "—"}
              </td>
              <td className="p-4 font-mono text-xs">{log.ip ?? "—"}</td>
              <td className="p-4 max-w-[240px] truncate font-mono text-xs text-fog">
                {log.metadata ? JSON.stringify(log.metadata) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
