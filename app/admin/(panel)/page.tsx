import { prisma } from "@/lib/prisma";
import { formatDateTime, pkr } from "@/lib/format";
import { getFinanceRates, getPlatformSettings } from "@/lib/platform-fees";
import { formatBps } from "@/lib/money";
import { LEDGER } from "@/lib/ledger";
import Link from "next/link";

export default async function AdminDashboard() {
  const [
    users,
    travelers,
    agencies,
    trips,
    bookings,
    rates,
    settings,
    disputes,
    pendingAgencies,
    pendingTrips,
    verified,
    published,
    recentTravelers,
    recentAgencies,
    recentTrips,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "TRAVELER" } }),
    prisma.agency.count(),
    prisma.trip.count(),
    prisma.booking.findMany({ include: { refund: true } }),
    getFinanceRates(),
    getPlatformSettings(),
    prisma.dispute.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
    prisma.agency.count({ where: { status: "PENDING" } }),
    prisma.trip.count({ where: { approvalStatus: "PENDING_APPROVAL" } }),
    prisma.agency.count({ where: { status: "APPROVED" } }),
    prisma.trip.count({ where: { published: true } }),
    prisma.user.findMany({
      where: { role: "TRAVELER" },
      orderBy: { createdAt: "desc" },
      take: 12,
      select: { id: true, name: true, email: true, createdAt: true },
    }),
    prisma.agency.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        businessName: true,
        city: true,
        status: true,
        createdAt: true,
        user: { select: { email: true, name: true } },
      },
    }),
    prisma.trip.findMany({
      orderBy: { createdAt: "desc" },
      take: 12,
      select: {
        id: true,
        title: true,
        fromCity: true,
        toDestination: true,
        createdAt: true,
        published: true,
        agency: { select: { id: true, businessName: true } },
      },
    }),
  ]);
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const today = bookings.filter((b) => b.bookedAt >= start).length;
  const paid = bookings.filter((b) => ["DEPOSIT_PAID", "FULLY_PAID", "COMPLETED"].includes(b.status));
  const gmv = paid.reduce((s, b) => s + b.totalPrice, 0);
  const commission = paid.reduce((s, b) => s + b.platformFee, 0);
  const fees = paid.reduce((s, b) => s + b.processingFee, 0);
  const refunds = bookings.reduce((s, b) => s + b.refundAmount, 0);
  const net = paid.reduce((s, b) => s + b.netRevenue, 0);
  const payables = paid.reduce((s, b) => s + b.agencySettlement, 0);
  const pendingSettlements = await prisma.settlement.count({
    where: { status: { in: ["PENDING", "APPROVED", "SCHEDULED"] } },
  });
  const pendingRefunds = await prisma.refundRequest.count({ where: { status: "PENDING" } });
  const cancelled = bookings.filter((b) => ["CANCELLED", "CANCEL_REQUESTED"].includes(b.status)).length;
  const ledgerSum = await prisma.ledgerEntry.groupBy({
    by: ["type"],
    _sum: { amount: true },
  });
  const ledger = Object.fromEntries(ledgerSum.map((r) => [r.type, r._sum.amount || 0]));

  const activity = [
    ...recentTravelers.map((row) => ({
      at: row.createdAt,
      kind: "New traveler",
      title: row.name,
      detail: row.email,
      href: "/admin/users?role=TRAVELER",
    })),
    ...recentAgencies.map((row) => ({
      at: row.createdAt,
      kind: "Agency joined",
      title: row.businessName,
      detail: `${row.user.email} · ${row.city} · ${row.status.toLowerCase()}`,
      href: "/admin/agencies",
    })),
    ...recentTrips.map((row) => ({
      at: row.createdAt,
      kind: "Trip posted",
      title: row.title,
      detail: `${row.agency.businessName} · ${row.fromCity} → ${row.toDestination}`,
      href: "/admin/trips",
    })),
  ]
    .sort((a, b) => b.at.getTime() - a.at.getTime())
    .slice(0, 18);

  return (
    <div>
      <h1 className="display text-4xl sm:text-5xl">TTN control</h1>
      <p className="mt-2 text-ink/60">
        Commission rate {formatBps(rates.commissionBps)} · {settings.currency} · {settings.timezone}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Travelers" value={String(travelers)} href="/admin/users?role=TRAVELER" />
        <Stat label="Agencies" value={`${agencies} · ${verified} verified`} href="/admin/agencies" />
        <Stat label="Total users" value={String(users)} href="/admin/users" />
        <Stat label="Pending agency approvals" value={String(pendingAgencies)} href="/admin/agencies" />
        <Stat label="Trips" value={`${trips} · ${published} published`} href="/admin/trips" />
        <Stat label="Trip approvals" value={String(pendingTrips)} href="/admin/trips" />
        <Stat label="Bookings" value={String(bookings.length)} />
        <Stat label="Today’s bookings" value={String(today)} />
        <Stat label="GMV" value={pkr(gmv)} />
        <Stat label="TTN commission" value={pkr(commission)} />
        <Stat label="Payment fees" value={pkr(fees || ledger[LEDGER.PROCESSING_FEE] || 0)} />
        <Stat label="Refunds" value={pkr(refunds)} />
        <Stat label="Net TTN revenue" value={pkr(net)} />
        <Stat label="Agency payables" value={pkr(payables)} />
        <Stat label="Pending settlements" value={String(pendingSettlements)} href="/admin/settlements" />
        <Stat label="Pending refunds" value={String(pendingRefunds)} href="/admin/refunds" />
        <Stat label="Cancelled bookings" value={String(cancelled)} />
        <Stat label="Open disputes" value={String(disputes)} href="/admin/disputes" />
      </div>
      <div className="mt-10 card rounded-3xl p-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs tracking-widest text-moss">ACTIVITY</p>
            <h2 className="display mt-1 text-3xl">Who joined, who posted</h2>
          </div>
          <Link href="/admin/users" className="text-sm text-link">
            All users →
          </Link>
        </div>
        <ul className="mt-5 divide-y divide-ink/10">
          {activity.map((item) => (
            <li key={`${item.kind}-${item.href}-${item.at.toISOString()}-${item.title}`} className="py-3">
              <Link href={item.href} className="block transition hover:text-pine">
                <p className="text-[10px] font-semibold tracking-[0.18em] text-moss">{item.kind}</p>
                <p className="mt-1 font-medium">{item.title}</p>
                <p className="text-sm text-ink/60">{item.detail}</p>
                <p className="mt-1 text-xs text-ink/45">{formatDateTime(item.at)}</p>
              </Link>
            </li>
          ))}
          {!activity.length ? <li className="py-4 text-sm text-ink/55">No sign-ups or trips yet.</li> : null}
        </ul>
      </div>
      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/admin/payments" className="btn-pine rounded-full px-4 py-2">
          Match payments
        </Link>
        <Link href="/admin/agencies" className="btn-gold rounded-full px-4 py-2 font-semibold">
          Verify agencies
        </Link>
        <Link href="/admin/settings" className="rounded-full border px-4 py-2">
          Platform settings
        </Link>
      </div>
    </div>
  );
}

function Stat({ label, value, href }: { label: string; value: string; href?: string }) {
  const inner = (
    <div className="card rounded-3xl p-5">
      <p className="text-xs tracking-widest text-moss">{label}</p>
      <p className="display mt-2 text-2xl sm:text-3xl">{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}
