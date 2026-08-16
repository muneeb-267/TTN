import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";

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

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <p className="text-xs tracking-[0.3em] text-moss">AGENCY PORTAL</p>
        <h1 className="display text-5xl">{agency.businessName}</h1>
        <p className="mt-2 text-ink/70">
          Status: {agency.status}
          {agency.status === "PENDING" ? ` · ${copy.pendingAgency}` : ""}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {agency.status === "APPROVED" ? (
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
