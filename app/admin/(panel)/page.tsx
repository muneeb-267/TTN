import { prisma } from "@/lib/prisma";
import { pkr } from "@/lib/format";
import { getFinanceRates, getPlatformSettings } from "@/lib/platform-fees";
import { formatBps } from "@/lib/money";
import { LEDGER } from "@/lib/ledger";
import Link from "next/link";

export default async function AdminDashboard() {
  const [users, agencies, trips, bookings, rates, settings, disputes, pendingAgencies, pendingTrips] =
    await Promise.all([
      prisma.user.count(),
      prisma.agency.count(),
      prisma.trip.count(),
      prisma.booking.findMany({ include: { refund: true } }),
      getFinanceRates(),
      getPlatformSettings(),
      prisma.dispute.count({ where: { status: { in: ["OPEN", "INVESTIGATING"] } } }),
      prisma.agency.count({ where: { status: "PENDING" } }),
      prisma.trip.count({ where: { approvalStatus: "PENDING_APPROVAL" } }),
    ]);
  const verified = await prisma.agency.count({ where: { status: "APPROVED" } });
  const published = await prisma.trip.count({ where: { published: true } });
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

  return (
    <div>
      <h1 className="display text-4xl sm:text-5xl">TTN control</h1>
      <p className="mt-2 text-ink/60">
        Commission rate {formatBps(rates.commissionBps)} · {settings.currency} · {settings.timezone}
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total users" value={String(users)} />
        <Stat label="Agencies" value={`${agencies} · ${verified} verified`} />
        <Stat label="Pending agency approvals" value={String(pendingAgencies)} href="/admin/agencies" />
        <Stat label="Trips" value={`${trips} · ${published} published`} />
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
