import Link from "next/link";
import { logout } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/agencies", label: "Agencies" },
  { href: "/admin/trips", label: "Trips" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/refunds", label: "Refunds" },
  { href: "/admin/settlements", label: "Settlements" },
  { href: "/admin/commission", label: "Commission" },
  { href: "/admin/reviews", label: "Reviews" },
  { href: "/admin/disputes", label: "Disputes" },
  { href: "/admin/analytics", label: "Analytics" },
  { href: "/admin/reports", label: "Reports" },
  { href: "/admin/settings", label: "Platform Settings" },
  { href: "/admin/audit", label: "Audit Logs" },
];

export function AdminShell({
  user,
  children,
}: {
  user: SessionUser;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-[#0f1c18] text-sand">
      <div className="mx-auto flex max-w-[90rem] flex-col lg:flex-row">
        <aside className="border-b border-sand/10 p-4 lg:min-h-screen lg:w-64 lg:border-b-0 lg:border-r">
          <Link href="/admin" className="display text-3xl text-gold-2">
            TTN Admin
          </Link>
          <p className="mt-1 text-[10px] tracking-[0.25em] text-sand/50">CONTROL ROOM</p>
          <nav className="mt-6 grid grid-cols-2 gap-1 text-sm lg:grid-cols-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-xl px-3 py-2 text-sand/80 transition hover:bg-sand/10 hover:text-gold"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <form action={logout} className="mt-8">
            <p className="truncate text-xs text-sand/50">{user.email}</p>
            <button className="mt-2 text-sm text-gold-2 underline" type="submit">
              Sign out
            </button>
          </form>
        </aside>
        <div className="min-w-0 flex-1 bg-cream text-ink">
          <div className="px-4 py-8 sm:px-8">{children}</div>
        </div>
      </div>
    </div>
  );
}
