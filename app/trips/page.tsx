import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { CITIES, DESTINATIONS } from "@/lib/constants";
import { PageShell } from "@/components/shell";

export default async function TripsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string }>;
}) {
  const { from, to } = await searchParams;
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
        <form className="mt-6 flex flex-wrap gap-3">
          <select name="from" defaultValue={from || ""} className="rounded-full border border-ink/10 bg-white px-4 py-2">
            <option value="">Any city</option>
            {CITIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select name="to" defaultValue={to || ""} className="rounded-full border border-ink/10 bg-white px-4 py-2">
            <option value="">Any destination</option>
            {DESTINATIONS.map((d) => (
              <option key={d}>{d}</option>
            ))}
          </select>
          <button className="btn-pine rounded-full px-4 py-2">Filter</button>
        </form>
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
              No trips match that filter yet.
            </p>
          ) : null}
        </div>
      </div>
    </PageShell>
  );
}
