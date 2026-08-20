import Link from "next/link";

const EXPORTS = [
  ["bookings", "Bookings"],
  ["payments", "Payments"],
  ["commission", "Commission"],
  ["settlements", "Agency settlements"],
  ["refunds", "Refunds"],
  ["users", "Users"],
  ["agencies", "Agencies"],
] as const;

export default function AdminReportsPage() {
  return (
    <div>
      <h1 className="display text-4xl">Reports</h1>
      <p className="mt-2 text-sm text-ink/60">CSV downloads from live database records.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2">
        {EXPORTS.map(([id, label]) => (
          <li key={id}>
            <Link href={`/admin/export/${id}`} className="card card-hover block rounded-3xl p-5">
              Download {label} CSV
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
