import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { PlaceHero, PlaceCard } from "@/components/place-media";
import { EmptyState } from "@/components/empty-state";
import { destinationImage, SCENE } from "@/lib/destinations";

export default async function AgencyPostedTripsPage() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const locale = await getLocale();
  const copy = t(locale);
  const agency = await prisma.agency.findUnique({
    where: { userId: session.id },
    include: {
      trips: { include: { seats: true, bookings: true }, orderBy: { departureAt: "asc" } },
    },
  });
  if (!agency) redirect("/agency/signup");
  const now = new Date();

  return (
    <PageShell locale={locale} user={session}>
      <PlaceHero
        image={SCENE.karakoram}
        kicker="Agency"
        title={copy.postedTrips}
        subtitle={copy.openEdit}
        compact
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap gap-3">
          {agency.status === "APPROVED" ? (
            <Link href="/agency/trips/new" className="btn-gold rounded-full px-5 py-2.5 font-semibold">
              {copy.postTrip}
            </Link>
          ) : (
            <p className="text-sm text-ink/65">{copy.pendingAgency}</p>
          )}
          <Link href="/agency/bookings" className="nav-link border border-ink/10">
            {copy.agencyBookings}
          </Link>
        </div>
        <div className="mt-8 grid gap-4">
          {agency.trips.map((trip) => {
            const left = trip.seats.filter((s) => !s.bookingId).length;
            const canEdit = trip.departureAt > now;
            return (
              <PlaceCard
                key={trip.id}
                image={destinationImage(trip.toDestination)}
                kicker={`${trip.fromCity} → ${trip.toDestination}`}
                title={trip.title}
                body={`${left}/${trip.seatCount} ${copy.seatsLeft} · ${pkr(trip.pricePerSeat)} · ${trip.bookings.length} ${copy.travelerCount} · ${formatDateTime(trip.departureAt, locale)}`}
              >
                <div className="mt-4 flex flex-wrap gap-2">
                  {canEdit ? (
                    <Link
                      href={`/agency/trips/${trip.id}/edit`}
                      className="btn-gold rounded-full px-4 py-2 text-sm font-semibold"
                    >
                      {copy.editTrip}
                    </Link>
                  ) : (
                    <span className="rounded-full border border-ink/10 px-4 py-2 text-sm text-ink/50">
                      Departed
                    </span>
                  )}
                  <Link href={`/trips/${trip.id}`} className="nav-link border border-ink/10 text-sm">
                    {copy.viewPublic}
                  </Link>
                  <Link href={`/agency/trips/${trip.id}`} className="nav-link border border-ink/10 text-sm">
                    {copy.tripRoster}
                  </Link>
                </div>
              </PlaceCard>
            );
          })}
          {!agency.trips.length ? (
            <EmptyState
              title={copy.postedTrips}
              body={copy.noPostedTrips}
              href={agency.status === "APPROVED" ? "/agency/trips/new" : undefined}
              cta={agency.status === "APPROVED" ? copy.postTrip : undefined}
            />
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
