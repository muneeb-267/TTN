import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { TripFilters } from "@/components/trip-filters";
import { TripCard } from "@/components/trip-card";
import { EmptyState } from "@/components/empty-state";
import { getFinanceRates } from "@/lib/platform-fees";
import { filterAndSortTrips, prismaTripWhere, searchSummary, type TripSearchInput } from "@/lib/trip-query";

function oneParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw || "").trim();
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const raw = await searchParams;
  const input: TripSearchInput = {
    from: oneParam(raw.from),
    to: oneParam(raw.to),
    date: oneParam(raw.date),
    dateTo: oneParam(raw.dateTo),
    minPrice: oneParam(raw.minPrice),
    maxPrice: oneParam(raw.maxPrice),
    minDuration: oneParam(raw.minDuration),
    maxDuration: oneParam(raw.maxDuration),
    seats: oneParam(raw.seats),
    vehicle: oneParam(raw.vehicle),
    hotel: oneParam(raw.hotel),
    meals: oneParam(raw.meals),
    family: oneParam(raw.family),
    style: oneParam(raw.style),
    verified: oneParam(raw.verified),
    rating: oneParam(raw.rating),
    sort: oneParam(raw.sort),
    q: oneParam(raw.q),
  };
  const locale = await getLocale();
  const user = await getSession();
  const rates = await getFinanceRates();
  const found = await prisma.trip.findMany({
    where: prismaTripWhere(input),
    include: {
      agency: { include: { reviews: true } },
      seats: true,
      media: true,
    },
    orderBy: { departureAt: "asc" },
    take: 80,
  });
  const trips = filterAndSortTrips(found, input);

  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="display text-5xl">Northbound departures</h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Group tours from Pakistan’s big cities. Compare date, vehicle, leftover seats and the
          agency taking the trip.
        </p>
        <TripFilters values={input} />
        <p className="mt-4 text-sm text-ink/60">{searchSummary(input, trips.length)}</p>
        <div className="mt-8 grid gap-5">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} locale={locale} depositBps={rates.depositBps} />
          ))}
          {!trips.length ? (
            <EmptyState
              title="No trips match your filters"
              body="Try another city, destination or date. New departures are posted by verified agencies."
              href="/trips"
              cta="Clear filters"
            />
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
