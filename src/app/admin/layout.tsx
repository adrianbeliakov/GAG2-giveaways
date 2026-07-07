import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAdmin } from "@/lib/guards";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin" };

/**
 * Admin shell. The middleware already gates /admin by JWT role, and this
 * layout re-verifies the role against the database on every request.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect("/");

  const nav = [
    { href: "/admin", label: "Overview" },
    { href: "/admin/giveaways", label: "Giveaways" },
    { href: "/admin/users", label: "Users" },
    { href: "/admin/audit", label: "Audit log" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-2xl font-bold">Admin</h1>
        <nav className="flex flex-wrap gap-1">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="btn-ghost !py-1.5 text-xs">
              {n.label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
