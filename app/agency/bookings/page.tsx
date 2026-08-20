import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { formatDateTime } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { PlaceHero, PlaceLinkCard } from "@/components/place-media";
import { EmptyState } from "@/components/empty-state";
import { destinationImage, SCENE } from "@/lib/destinations";

export default async function AgencyBookingsByTripPage() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const locale = await getLocale();
  const copy = t(locale);
  const agency = await prisma.agency.findUnique({
    where: { userId: session.id },
    include: {
      trips: {
        where: { bookings: { some: {} } },
        include: { seats: true, bookings: true },
        orderBy: { departureAt: "asc" },
      },
    },
  });
  if (!agency) redirect("/agency/signup");

  return (
    <PageShell locale={locale} user={session}>
      <PlaceHero
        image={SCENE.naran}
        kicker="Agency"
        title={copy.agencyBookings}
        subtitle={copy.bookingsByTrip}
        compact
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/agency/trips" className="text-link text-sm">
          ← {copy.backToPosted}
        </Link>
        <div className="mt-6 grid gap-4">
          {agency.trips.map((trip) => {
            const filled = trip.seats.filter((s) => s.bookingId).length;
            return (
              <PlaceLinkCard
                key={trip.id}
                href={`/agency/trips/${trip.id}`}
                image={destinationImage(trip.toDestination)}
                kicker={`${trip.fromCity} → ${trip.toDestination}`}
                title={trip.title}
                body={`${trip.bookings.length} ${copy.travelerCount} · ${filled}/${trip.seatCount} ${copy.seatsFilled} · ${formatDateTime(trip.departureAt, locale)}`}
              />
            );
          })}
          {!agency.trips.length ? (
            <EmptyState
              title={copy.agencyBookings}
              body={copy.noTripBookings}
              href="/agency/trips"
              cta={copy.postedTrips}
            />
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
