import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { formatDate, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { AgencyFeePayForm } from "@/components/fee-forms";
import { PlaceHero, PlaceLinkCard } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";
import { enforceAgencyFeeStatus, platformPayoutAccounts, commissionLabel } from "@/lib/platform-fees";

export default async function AgencyHome() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const locale = await getLocale();
  const copy = t(locale);
  const agency = await prisma.agency.findUnique({
    where: { userId: session.id },
    include: {
      refunds: { where: { status: "PENDING" } },
    },
  });
  if (!agency) redirect("/agency/signup");
  const ledger = await enforceAgencyFeeStatus(agency.id);
  const platformAccounts = await platformPayoutAccounts();
  const feeName = await commissionLabel();
  const [feeHistory, tripCount, bookingStats, travelerGroups, marketplaceTravelers, marketplaceAgencies] =
    await Promise.all([
    prisma.platformFeePayment.findMany({
      where: { agencyId: agency.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.trip.count({ where: { agencyId: agency.id } }),
    prisma.booking.aggregate({
      where: {
        trip: { agencyId: agency.id },
        status: { notIn: ["EXPIRED"] },
      },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["travelerId"],
      where: {
        trip: { agencyId: agency.id },
        status: { notIn: ["EXPIRED"] },
      },
    }),
    prisma.user.count({ where: { role: "TRAVELER" } }),
    prisma.agency.count(),
  ]);

  return (
    <PageShell locale={locale} user={session}>
      <PlaceHero
        image={SCENE.passu}
        kicker="Agency portal"
        title={agency.businessName}
        subtitle={`Status: ${ledger.status === "DELISTED" ? "Not listed" : agency.status}${agency.status === "PENDING" ? ` · ${copy.pendingAgency}` : ""}`}
        compact
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-3">
          <Stat label="Your travelers" value={String(travelerGroups.length)} />
          <Stat label="Your bookings" value={String(bookingStats._count._all)} />
          <Stat label="Trips posted" value={String(tripCount)} />
          <Stat label="TTN travelers" value={String(marketplaceTravelers)} />
          <Stat label="TTN agencies" value={String(marketplaceAgencies)} />
        </div>
        <div className="card mt-8 rounded-3xl p-6">
          <p className="text-xs tracking-widest text-moss">PLATFORM FEE ({feeName})</p>
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
                    <th className="pb-2 font-semibold">{feeName} fee</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.lines.map((line) => (
                    <tr key={line.tripId} className="border-t border-gold/25">
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
            <p className="mt-4 text-sm text-ink/60">No paid seats yet. {feeName} is counted once travelers’ deposits are confirmed.</p>
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
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <PlaceLinkCard
            href="/agency/trips"
            image={SCENE.karakoram}
            kicker="Listings"
            title={copy.postedTrips}
            body={copy.openEdit}
          />
          <PlaceLinkCard
            href="/agency/bookings"
            image={SCENE.naran}
            kicker="Travelers"
            title={copy.agencyBookings}
            body={copy.bookingsByTrip}
          />
        </div>
        <div className="mt-4">
          <PlaceLinkCard
            href="/agency/gallery"
            image={SCENE.hunza}
            kicker="Public page"
            title={copy.agencyProfile}
            body="About previous trips, photos, videos, reviews and comments — like an Instagram profile."
          />
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          {ledger.status === "APPROVED" ? (
            <Link href="/agency/trips/new" className="btn-gold rounded-full px-5 py-2.5 font-semibold">
              {copy.postTrip}
            </Link>
          ) : null}
          <Link href="/agency/gallery" className="nav-link border border-gold/40">
            {copy.agencyProfile}
          </Link>
          <Link href="/agency/refunds" className="nav-link border border-gold/40">
            Refunds {agency.refunds.length ? `(${agency.refunds.length})` : ""}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-3xl p-5">
      <p className="text-xs tracking-widest text-moss">{label}</p>
      <p className="display mt-2 text-3xl">{value}</p>
    </div>
  );
}
