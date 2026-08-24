import { prisma } from "@/lib/prisma";
import { pkr } from "@/lib/format";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const { q = "", status = "" } = await searchParams;
  const bookings = await prisma.booking.findMany({
    where: {
      ...(status ? { status } : {}),
      ...(q
        ? {
            OR: [
              { publicRef: { contains: q } },
              { traveler: { name: { contains: q } } },
              { traveler: { email: { contains: q } } },
              { trip: { title: { contains: q } } },
              { trip: { agency: { businessName: { contains: q } } } },
              { payments: { some: { id: { contains: q } } } },
            ],
          }
        : {}),
    },
    include: { traveler: true, trip: { include: { agency: true } }, payments: true },
    orderBy: { bookedAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="display text-4xl">Bookings</h1>
      <form className="mt-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Booking ID, traveler, agency, payment" className="rounded-full border px-4 py-2" />
        <select name="status" defaultValue={status} className="rounded-full border px-4 py-2">
          <option value="">All statuses</option>
          {["AWAITING_PAYMENT", "DEPOSIT_PAID", "FULLY_PAID", "COMPLETED", "CANCELLED", "EXPIRED", "FAILED"].map((s) => (
            <option key={s} value={s}>
              {s.replaceAll("_", " ")}
            </option>
          ))}
        </select>
        <button className="btn-pine rounded-full px-4 py-2">Search</button>
      </form>
      <div className="mt-6 overflow-x-auto">
        <table className="w-full min-w-[56rem] text-left text-sm">
          <thead>
            <tr className="text-xs tracking-widest text-moss">
              <th className="pb-2">Ref</th>
              <th className="pb-2">Traveler</th>
              <th className="pb-2">Gross</th>
              <th className="pb-2">Commission</th>
              <th className="pb-2">Fee</th>
              <th className="pb-2">Agency</th>
              <th className="pb-2">Paid / remain</th>
              <th className="pb-2">Refund</th>
              <th className="pb-2">Net</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => {
              const paid = b.payments.filter((p) => p.status === "CONFIRMED").reduce((s, p) => s + p.amount, 0);
              return (
                <tr key={b.id} className="border-t border-ink/10 align-top">
                  <td className="py-3">
                    <p className="font-medium">{b.publicRef}</p>
                    <p className="text-ink/50">{b.status.replaceAll("_", " ")}</p>
                  </td>
                  <td>
                    {b.traveler.name}
                    <span className="block text-ink/50">{b.trip.agency.businessName}</span>
                  </td>
                  <td>{pkr(b.totalPrice)}</td>
                  <td>{pkr(b.platformFee)}</td>
                  <td>{pkr(b.processingFee)}</td>
                  <td>{pkr(b.agencySettlement)}</td>
                  <td>
                    {pkr(paid)} / {pkr(b.remainingAmount)}
                  </td>
                  <td>{pkr(b.refundAmount)}</td>
                  <td>{pkr(b.netRevenue)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
