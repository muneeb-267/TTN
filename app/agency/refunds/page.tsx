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
          Same-day backing off should be paid back in full. After one day the split is automatic.
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
              <p className="mt-2 text-sm text-ink/70">
                {r.sameDay ? "Same-day · full refund requested" : "After one day · policy split applied"}{" "}
                · traveler {pkr(r.travelerRefund)} · TTN {pkr(r.platformKeep)} · agency {pkr(r.agencyKeep)}
              </p>
              <p className="mt-1 text-sm font-medium">{r.status}</p>
              {r.status === "PENDING" ? (
                <form action={decideRefund.bind(null, r.id)} className="mt-4 space-y-3">
                  <textarea name="note" className={inputClass} placeholder="Note to traveler" />
                  <div className="flex gap-2">
                    <button name="decision" value="approve" className="rounded-full bg-pine px-4 py-2 text-sand">
                      Approve payback
                    </button>
                    <button name="decision" value="reject" className="rounded-full border border-ink/15 px-4 py-2">
                      Reject
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
