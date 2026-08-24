import { prisma } from "@/lib/prisma";
import { pkr } from "@/lib/format";
import { adminConfirmPayment, adminRejectPayment } from "@/app/actions/payments";
import { adminConfirmFeePayment, adminRejectFeePayment } from "@/app/actions/fees";

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "PENDING", q = "" } = await searchParams;
  const payments = await prisma.payment.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { providerTxn: { contains: q } },
              { booking: { publicRef: { contains: q } } },
            ],
          }
        : {}),
    },
    include: { booking: { include: { traveler: true, trip: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const feePayments = await prisma.platformFeePayment.findMany({
    where: { status: "PENDING", source: "AGENCY" },
    include: { agency: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="display text-4xl">Payments</h1>
      <form className="mt-6 flex flex-wrap gap-2" action="/admin/payments">
        <input name="q" defaultValue={q} placeholder="Booking ref or TID" className="rounded-full border px-4 py-2" />
        <select name="status" defaultValue={status} className="rounded-full border px-4 py-2">
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Successful</option>
          <option value="FAILED">Failed</option>
          <option value="EXPIRED">Expired</option>
        </select>
        <button className="btn-pine rounded-full px-4 py-2">Filter</button>
      </form>
      <h2 className="display mt-10 text-3xl">Platform fees to match</h2>
      <div className="mt-4 grid gap-3">
        {feePayments.length === 0 ? (
          <p className="text-sm text-ink/60">No pending agency fee transfers.</p>
        ) : (
          feePayments.map((p) => (
            <div key={p.id} className="card rounded-3xl p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div className="text-sm">
                  <p className="display text-2xl">{p.agency.businessName}</p>
                  <p>
                    {p.method} · {pkr(p.amount)}
                  </p>
                  {p.providerTxn ? <p>TID / RR {p.providerTxn}</p> : <p>No TID submitted yet</p>}
                </div>
                <div className="flex gap-2">
                  <form action={adminConfirmFeePayment.bind(null, p.id)}>
                    <button className="btn-pine rounded-full px-4 py-2">Confirm received</button>
                  </form>
                  <form action={adminRejectFeePayment.bind(null, p.id)}>
                    <button className="rounded-full border px-4 py-2">Reject</button>
                  </form>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      <h2 className="display mt-12 text-3xl">Traveler payments</h2>
      <div className="mt-4 grid gap-3">
        {payments.map((p) => (
          <div key={p.id} className="card rounded-3xl p-5">
            <div className="flex flex-wrap justify-between gap-3">
              <div className="text-sm">
                <p className="display text-2xl">{p.booking.publicRef}</p>
                <p>
                  {p.id} · {p.method} · {pkr(p.amount)} · {p.status}
                </p>
                <p className="text-ink/70">
                  {p.booking.traveler.name} · {p.booking.trip.title}
                </p>
                {p.providerTxn ? <p>Provider ref {p.providerTxn}</p> : null}
                {p.failureReason ? <p className="text-red-800">{p.failureReason}</p> : null}
              </div>
              {p.status === "PENDING" ? (
                <div className="flex gap-2">
                  <form action={adminConfirmPayment.bind(null, p.id)} className="flex flex-col gap-2">
                    <input name="reason" required placeholder="Match reason" className="rounded-full border px-3 py-1 text-xs" defaultValue="Matched transfer to listed account." />
                    <button className="btn-pine rounded-full px-4 py-2">Confirm received</button>
                  </form>
                  <form action={adminRejectPayment.bind(null, p.id)}>
                    <input type="hidden" name="note" value="Could not match this transfer." />
                    <button className="rounded-full border px-4 py-2">Reject</button>
                  </form>
                </div>
              ) : null}
            </div>
          </div>
        ))}
        {!payments.length ? <p className="text-sm text-ink/60">No payments match.</p> : null}
      </div>
    </div>
  );
}
