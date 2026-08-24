import { prisma } from "@/lib/prisma";
import { pkr } from "@/lib/format";

export default async function AdminRefundsPage() {
  const refunds = await prisma.refundRequest.findMany({
    include: { booking: true, traveler: true, agency: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="display text-4xl">Refunds</h1>
      <div className="mt-6 grid gap-3">
        {refunds.map((r) => (
          <div key={r.id} className="card rounded-3xl p-5 text-sm">
            <p className="display text-2xl">{r.booking.publicRef}</p>
            <p>
              {r.traveler.name} · {r.agency.businessName} · {r.status}
            </p>
            <p>
              Traveler {pkr(r.travelerRefund)} · TTN keep {pkr(r.platformKeep)} · Agency {pkr(r.agencyKeep)}
            </p>
            <p className="text-ink/60">{r.reason}</p>
          </div>
        ))}
        {!refunds.length ? <p className="text-sm text-ink/60">No refund requests.</p> : null}
      </div>
    </div>
  );
}
