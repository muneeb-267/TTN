import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n";
import { pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { inputClass } from "@/components/fields";
import { decideRefund } from "@/app/actions/bookings";

export default async function AgencyRefundsPage() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const locale = await getLocale();
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency) redirect("/agency/signup");
  const refunds = await prisma.refundRequest.findMany({
    where: { agencyId: agency.id },
    include: { booking: { include: { traveler: true, trip: true, seats: true } } },
    orderBy: { createdAt: "desc" },
  });
  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="display text-5xl">Refund requests</h1>
        <p className="mt-3 mb-8 text-ink/70">
          If a traveler asks within 24 hours, you must refund in full to the account they listed.
          If you refuse, TTN fines you the fare of one seat on that trip. After 24 hours: of the
          half payment, 15% TTN, 15% agency, 20% back to the traveler. Refunds are only for
          bookings that have not been paid in full.
        </p>
        <div className="space-y-4">
          {refunds.map((r) => (
            <div key={r.id} className="card rounded-3xl p-5">
              <p className="text-xs text-ink/50">{r.booking.publicRef}</p>
              <h2 className="display text-2xl">{r.booking.trip.title}</h2>
              <p className="text-sm">
                {r.booking.traveler.name} · seats {r.booking.seats.map((s) => s.code).join(", ")}
              </p>
              <p className="mt-2 text-sm">{r.reason}</p>
              {r.payoutAccountNo ? (
                <div className="mt-3 rounded-2xl bg-sand/80 p-3 text-sm">
                  <p className="text-xs tracking-widest text-moss">SEND REFUND HERE</p>
                  <p className="mt-1 font-medium">
                    {r.payoutAccountName} · {r.payoutMethod}
                    {r.payoutBank ? ` · ${r.payoutBank}` : ""}
                  </p>
                  <p className="mt-0.5">{r.payoutAccountNo}</p>
                </div>
              ) : null}
              <p className="mt-2 text-sm text-ink/70">
                {r.sameDay
                  ? `Within 24 hours · full refund required · refuse and TTN fines you ${pkr(r.booking.trip.pricePerSeat)} (one seat)`
                  : "After 24 hours · 15% TTN / 15% agency of the half"}{" "}
                · traveler {pkr(r.travelerRefund)} · TTN {pkr(r.platformKeep)} · agency{" "}
                {pkr(r.agencyKeep)}
              </p>
              {r.agencyFine ? (
                <p className="mt-1 text-sm font-medium text-red-800">
                  Fine charged to TTN: {pkr(r.agencyFine)}
                </p>
              ) : null}
              <p className="mt-1 text-sm font-medium">{r.status}</p>
              {r.status === "PENDING" ? (
                <form action={decideRefund.bind(null, r.id)} className="mt-4 space-y-3">
                  <textarea name="note" className={inputClass} placeholder="Note to traveler" />
                  <div className="flex flex-wrap gap-2">
                    <button name="decision" value="approve" className="btn-pine rounded-full px-4 py-2">
                      Approve payback
                    </button>
                    <button
                      name="decision"
                      value="reject"
                      className="rounded-full border border-ink/15 px-4 py-2 transition hover:border-gold hover:bg-sand"
                    >
                      {r.sameDay
                        ? `Refuse (fine ${pkr(r.booking.trip.pricePerSeat)})`
                        : "Reject"}
                    </button>
                  </div>
                </form>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
