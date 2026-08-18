import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n";
import { parseHotelLinks, toDatetimeLocal } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { TripForm } from "@/components/trip-form";

export default async function EditTripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency || agency.status !== "APPROVED") redirect("/agency");
  const locale = await getLocale();
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { seats: true },
  });
  if (!trip || trip.agencyId !== agency.id) notFound();
  if (trip.departureAt <= new Date()) {
    redirect(`/agency/trips/${trip.id}`);
  }

  const booked = trip.seats.filter((s) => s.bookingId);
  const highestBooked = Math.max(
    0,
    ...booked.map((s) => Number(s.code)).filter((n) => Number.isFinite(n)),
  );
  const minSeatCount = Math.max(4, booked.length, highestBooked);

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href={`/agency/trips/${trip.id}`} className="text-link text-sm">
          ← Back to trip
        </Link>
        <h1 className="display mt-3 text-5xl">Edit trip</h1>
        <p className="mb-8 mt-3 text-ink/70">
          Change seats, hotels, rooms, vehicle, itinerary and payout details until the coaster
          leaves. You cannot remove seats that are already booked.
        </p>
        <TripForm
          trip={{
            id: trip.id,
            title: trip.title,
            fromCity: trip.fromCity,
            toDestination: trip.toDestination,
            departureAt: toDatetimeLocal(trip.departureAt),
            returnAt: toDatetimeLocal(trip.returnAt),
            vehicleType: trip.vehicleType,
            vehicleDetail: trip.vehicleDetail,
            seatCount: trip.seatCount,
            pricePerSeat: trip.pricePerSeat,
            itinerary: trip.itinerary,
            hotels: parseHotelLinks(trip.hotelLinks),
            jazzcashName: trip.jazzcashName,
            jazzcashNumber: trip.jazzcashNumber,
            easypaisaName: trip.easypaisaName,
            easypaisaNumber: trip.easypaisaNumber,
            bankName: trip.bankName,
            bankTitle: trip.bankTitle,
            bankIban: trip.bankIban,
            bankAccount: trip.bankAccount,
            minSeatCount,
            bookedSeats: booked.length,
          }}
        />
      </div>
    </PageShell>
  );
}
