import { prisma } from "@/lib/prisma";
import { pkr } from "@/lib/format";
import { formatBps } from "@/lib/money";
import { getFinanceRates } from "@/lib/platform-fees";
import { saveCommissionSettings } from "@/app/actions/admin";

export default async function AdminCommissionPage() {
  const rates = await getFinanceRates();
  const paid = await prisma.booking.findMany({
    where: { status: { in: ["DEPOSIT_PAID", "FULLY_PAID", "COMPLETED"] } },
  });
  const gmv = paid.reduce((s, b) => s + b.totalPrice, 0);
  const commission = paid.reduce((s, b) => s + b.platformFee, 0);
  const fees = paid.reduce((s, b) => s + b.processingFee, 0);
  const refunds = (await prisma.booking.aggregate({ _sum: { refundAmount: true } }))._sum.refundAmount || 0;
  const net = paid.reduce((s, b) => s + b.netRevenue, 0);
  const avg = paid.length ? Math.round(gmv / paid.length) : 0;

  return (
    <div>
      <h1 className="display text-4xl">Commission</h1>
      <p className="mt-2 text-sm text-ink/60">
        Changing the rate applies to new bookings only. Completed bookings keep the snapshot stored on the
        booking row.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card label="GMV" value={pkr(gmv)} />
        <Card label={`Commission (${formatBps(rates.commissionBps)})`} value={pkr(commission)} />
        <Card label="Average booking" value={pkr(avg)} />
        <Card label="Payment fees" value={pkr(fees)} />
        <Card label="Refunds" value={pkr(refunds)} />
        <Card label="Net revenue" value={pkr(net)} />
      </div>
      <form action={saveCommissionSettings} className="card mt-10 max-w-lg space-y-4 rounded-3xl p-6">
        <label className="block text-sm">
          Platform commission (basis points, 250 = 2.5%)
          <input name="commissionBps" type="number" required defaultValue={rates.commissionBps} className="mt-1 w-full rounded-full border px-4 py-2" />
        </label>
        <label className="block text-sm">
          Payment processing fee (bps, 0 until a provider agreement exists)
          <input name="processingFeeBps" type="number" required defaultValue={rates.processingFeeBps} className="mt-1 w-full rounded-full border px-4 py-2" />
        </label>
        <label className="block text-sm">
          Default deposit (bps, 5000 = 50%)
          <input name="depositBps" type="number" required defaultValue={rates.depositBps} className="mt-1 w-full rounded-full border px-4 py-2" />
        </label>
        <label className="block text-sm">
          Seat hold minutes
          <input name="seatHoldMinutes" type="number" required defaultValue={rates.seatHoldMinutes} className="mt-1 w-full rounded-full border px-4 py-2" />
        </label>
        <button className="btn-gold rounded-full px-5 py-2.5 font-semibold">Save rates</button>
      </form>
    </div>
  );
}

function Card({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-3xl p-5">
      <p className="text-xs tracking-widest text-moss">{label}</p>
      <p className="display mt-2 text-3xl">{value}</p>
    </div>
  );
}
