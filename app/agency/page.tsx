import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { formatDate, formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { AgencyFeePayForm } from "@/components/fee-forms";
import { enforceAgencyFeeStatus, platformPayoutAccounts } from "@/lib/platform-fees";

export default async function AgencyHome() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const locale = await getLocale();
  const copy = t(locale);
  const agency = await prisma.agency.findUnique({
    where: { userId: session.id },
    include: {
      trips: { include: { seats: true, bookings: true }, orderBy: { departureAt: "asc" } },
      media: true,
      refunds: { where: { status: "PENDING" } },
    },
  });
  if (!agency) redirect("/agency/signup");
  const ledger = await enforceAgencyFeeStatus(agency.id);
  const platformAccounts = await platformPayoutAccounts();
  const feeHistory = await prisma.platformFeePayment.findMany({
    where: { agencyId: agency.id },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs tracking-[0.3em] text-moss">AGENCY PORTAL</p>
        <h1 className="display text-5xl">{agency.businessName}</h1>
        <p className="mt-2 text-ink/70">
          Status: {ledger.status === "DELISTED" ? "Not listed" : agency.status}
          {agency.status === "PENDING" ? ` · ${copy.pendingAgency}` : ""}
          {ledger.status === "DELISTED"
            ? " · Pay the platform fee below to be listed again."
            : ""}
        </p>
        <div className="card mt-8 rounded-3xl p-6">
          <p className="text-xs tracking-widest text-moss">PLATFORM FEE (2.5%)</p>
          <h2 className="display mt-2 text-3xl">{pkr(ledger.outstanding)} due</h2>
          <p className="mt-2 text-sm text-ink/70">
            {ledger.upcoming > 0 ? `${pkr(ledger.upcoming)} more after trips return. ` : ""}
            {ledger.dueAt
              ? `Pay within 2 days of the trip ending (by ${formatDate(ledger.dueAt, locale)}).`
              : "Fees are due 2 days after each trip returns. Send them to the TTN account below."}
          </p>
          {ledger.lines.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="text-xs tracking-widest text-moss">
                    <th className="pb-2 font-semibold">Trip</th>
                    <th className="pb-2 font-semibold">Seats booked</th>
                    <th className="pb-2 font-semibold">Fare</th>
                    <th className="pb-2 font-semibold">2.5% fee</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.lines.map((line) => (
                    <tr key={line.tripId} className="border-t border-ink/10">
                      <td className="py-2 pr-3">
                        <span className="font-medium">{line.title}</span>
                        <span className="mt-0.5 block text-xs text-ink/55">
                          {line.fromCity} → {line.toDestination}
                          {line.due ? "" : " · after return"}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{line.seats}</td>
                      <td className="py-2 pr-3">{pkr(line.fare)}</td>
                      <td className="py-2 font-semibold">{pkr(line.fee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/60">No paid seats yet. 2.5% is counted once travelers’ deposits are confirmed.</p>
          )}
          <div className="mt-6">
            <AgencyFeePayForm amountDue={Math.max(ledger.outstanding, 0)} accounts={platformAccounts} />
          </div>
          {feeHistory.length ? (
            <ul className="mt-6 space-y-1 text-sm text-ink/65">
              {feeHistory.map((p) => (
                <li key={p.id}>
                  {p.status.toLowerCase()} · {pkr(p.amount)} · {p.method}
                  {p.providerTxn ? ` · ${p.providerTxn}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {ledger.status === "APPROVED" ? (
          <Link href="/agency/trips/new" className="btn-gold rounded-full px-5 py-2.5 font-semibold">
              {copy.postTrip}
            </Link>
          ) : null}
          <Link href="/agency/gallery" className="nav-link border border-ink/10">
            {copy.gallery}
          </Link>
          <Link href="/agency/refunds" className="nav-link border border-ink/10">
            Refunds {agency.refunds.length ? `(${agency.refunds.length})` : ""}
          </Link>
        </div>
        <div className="mt-10 grid gap-4">
          {agency.trips.map((trip) => {
            const left = trip.seats.filter((s) => !s.bookingId).length;
            return (
              <Link key={trip.id} href={`/agency/trips/${trip.id}`} className="card card-hover rounded-3xl p-5">
                <h2 className="display text-2xl">{trip.title}</h2>
                <p className="text-sm text-ink/70">
                  {trip.fromCity} → {trip.toDestination} · {formatDateTime(trip.departureAt, locale)}
                </p>
                <p className="text-sm">
                  {left}/{trip.seatCount} seats open · {pkr(trip.pricePerSeat)} · {trip.bookings.length}{" "}
                  bookings
                </p>
              </Link>
            );
          })}
        </div>
      </div>
    </PageShell>
  );
}
