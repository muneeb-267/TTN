import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { CITIES, DESTINATIONS } from "@/lib/constants";
import { PageShell } from "@/components/shell";
import { TripFilters } from "@/components/trip-filters";

function oneParam(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value;
  return (raw || "").trim();
}

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string | string[]; to?: string | string[] }>;
}) {
  const raw = await searchParams;
  const from = CITIES.includes(oneParam(raw.from) as (typeof CITIES)[number])
    ? oneParam(raw.from)
    : "";
  const to = DESTINATIONS.includes(oneParam(raw.to) as (typeof DESTINATIONS)[number])
    ? oneParam(raw.to)
    : "";
  const locale = await getLocale();
  const user = await getSession();
  const copy = t(locale);
  const trips = await prisma.trip.findMany({
    where: {
      published: true,
      departureAt: { gte: new Date() },
      agency: { status: "APPROVED" },
      ...(from ? { fromCity: from } : {}),
      ...(to ? { toDestination: to } : {}),
    },
    include: {
      agency: true,
      seats: true,
    },
    orderBy: { departureAt: "asc" },
  });

  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="display text-5xl">Northbound departures</h1>
        <p className="mt-3 max-w-2xl text-ink/70">
          Group tours from Pakistan’s big cities. Compare date, vehicle, leftover seats and the
          agency taking the trip.
        </p>
        <TripFilters from={from} to={to} />
        {(from || to) && trips.length ? (
          <p className="mt-4 text-sm text-ink/60">
            Showing {trips.length} trip{trips.length === 1 ? "" : "s"}
            {from ? ` from ${from}` : ""}
            {to ? ` to ${to}` : ""}.
          </p>
        ) : null}
        <div className="mt-8 grid gap-5">
          {trips.map((trip) => {
            const left = trip.seats.filter((s) => !s.bookingId).length;
            return (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="card card-hover grid gap-4 rounded-3xl p-5 sm:grid-cols-[1fr_auto]"
              >
                <div>
                  <p className="text-xs tracking-[0.25em] text-moss">
                    {trip.fromCity} → {trip.toDestination}
                  </p>
                  <h2 className="display mt-1 text-3xl">{trip.title}</h2>
                  <p className="mt-2 text-sm text-ink/70">
                    {trip.agency.businessName} · {trip.vehicleType} · {trip.vehicleDetail}
                  </p>
                  <p className="mt-1 text-sm">
                    {copy.when}: {formatDateTime(trip.departureAt, locale)} →{" "}
                    {formatDateTime(trip.returnAt, locale)}
                  </p>
                </div>
                <div className="text-left sm:text-right">
                  <p className="display text-3xl">{pkr(trip.pricePerSeat)}</p>
                  <p className="text-sm text-ink/60">per seat</p>
                  <p className="mt-2 text-sm font-medium text-moss">
                    {left}/{trip.seatCount} {copy.seatsLeft}
                  </p>
                </div>
              </Link>
            );
          })}
          {!trips.length ? (
            <p className="rounded-3xl border border-dashed border-ink/15 p-10 text-ink/60">
              No trips match
              {from ? ` ${from}` : ""}
              {from && to ? " →" : ""}
              {to ? ` ${to}` : ""}
              . Try another city or destination.
            </p>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
