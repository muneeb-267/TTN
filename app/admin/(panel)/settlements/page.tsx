import { prisma } from "@/lib/prisma";
import { pkr } from "@/lib/format";
import { settleAgency } from "@/app/actions/admin";
import { agencyFeeLedger } from "@/lib/platform-fees";
import { connectTransferredPkr } from "@/lib/connect";

export default async function AdminSettlementsPage() {
  const agencies = await prisma.agency.findMany({
    where: { status: { in: ["APPROVED", "DELISTED"] } },
    include: { trips: { include: { bookings: true } } },
    orderBy: { businessName: "asc" },
  });
  const settlements = await prisma.settlement.findMany({
    include: { agency: true },
    orderBy: { createdAt: "desc" },
    take: 40,
  });

  return (
    <div>
      <h1 className="display text-4xl">Settlements</h1>
      <p className="mt-2 max-w-2xl text-sm text-ink/65">
        Card charges to a connected payout account already transferred the agency share. The net below
        subtracts those automatic transfers. JazzCash, EasyPaisa and bank collections still need a
        manual settlement.
      </p>
      <div className="mt-8 grid gap-4">
        {await Promise.all(
          agencies.map(async (agency) => {
            const bookings = agency.trips.flatMap((t) => t.bookings);
            const paid = bookings.filter((b) => ["DEPOSIT_PAID", "FULLY_PAID", "COMPLETED"].includes(b.status));
            const gross = paid.reduce((s, b) => s + b.totalPrice, 0);
            const commission = paid.reduce((s, b) => s + b.platformFee, 0);
            const fees = paid.reduce((s, b) => s + b.processingFee, 0);
            const refunds = bookings.reduce((s, b) => s + b.refundAmount, 0);
            const ledgerPayable = paid.reduce((s, b) => s + b.agencySettlement, 0);
            const alreadyTransferred = await connectTransferredPkr(agency.id);
            const payable = Math.max(0, ledgerPayable - alreadyTransferred);
            const ledger = await agencyFeeLedger(agency.id);
            return (
              <div key={agency.id} className="card rounded-3xl p-5">
                <h2 className="display text-2xl">{agency.businessName}</h2>
                <ul className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                  <li>Gross bookings: {pkr(gross)}</li>
                  <li>TTN commission: {pkr(commission)}</li>
                  <li>Payment fees: {pkr(fees)}</li>
                  <li>Refunds: {pkr(refunds)}</li>
                  <li>Already transferred on cards: {pkr(alreadyTransferred)}</li>
                  <li>Net still payable: {pkr(payable)}</li>
                  <li>Platform fee outstanding: {pkr(ledger.outstanding)}</li>
                </ul>
                <form action={settleAgency} className="mt-4 flex flex-wrap gap-2">
                  <input type="hidden" name="agencyId" value={agency.id} />
                  <input type="hidden" name="grossAmount" value={gross} />
                  <input type="hidden" name="commissionAmount" value={commission} />
                  <input type="hidden" name="processingFeeAmount" value={fees} />
                  <input type="hidden" name="refundAmount" value={refunds} />
                  <input type="hidden" name="netPayable" value={payable} />
                  <input name="note" placeholder="Note" className="rounded-full border px-3 py-1.5 text-sm" />
                  <button className="btn-pine rounded-full px-4 py-2 text-sm">Create settlement</button>
                </form>
              </div>
            );
          }),
        )}
      </div>
      <h2 className="display mt-10 text-3xl">Settlement actions</h2>
      <div className="mt-4 grid gap-3">
        {settlements.map((s) => (
          <div key={s.id} className="card flex flex-wrap items-center justify-between gap-3 rounded-3xl p-5">
            <div className="text-sm">
              <p className="font-semibold">
                {s.agency.businessName} · {s.status} · {pkr(s.netPayable)}
              </p>
              <p className="text-ink/55">{s.note}</p>
            </div>
            <form action={settleAgency} className="flex flex-wrap gap-2">
              <input type="hidden" name="settlementId" value={s.id} />
              <button name="action" value="approve" className="rounded-full border px-3 py-1.5 text-sm">
                Approve
              </button>
              <button name="action" value="hold" className="rounded-full border px-3 py-1.5 text-sm">
                Hold
              </button>
              <button name="action" value="pay" className="btn-pine rounded-full px-3 py-1.5 text-sm">
                Mark paid
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}
