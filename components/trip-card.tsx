import Link from "next/link";
import { formatDate, pkr, parseHotelLinks } from "@/lib/format";
import { applyBps } from "@/lib/money";
import { destinationImage, tripDurationNights } from "@/lib/destinations";
import { agencyRating } from "@/lib/trip-query";

export type TripCardTrip = {
  id: string;
  title: string;
  fromCity: string;
  toDestination: string;
  departureAt: Date;
  returnAt: Date;
  vehicleType: string;
  pricePerSeat: number;
  hotelLinks: string;
  mealsIncluded: boolean;
  familyFriendly?: boolean;
  depositAmount?: number;
  remainingAmount?: number;
  agency: { businessName: string; status: string; reviews: { rating: number }[] };
  seats: { bookingId: string | null }[];
  media?: { url: string; kind: string }[];
};

export function TripCard({
  trip,
  locale = "en",
  depositBps = 5000,
}: {
  trip: TripCardTrip;
  locale?: "en" | "ur";
  depositBps?: number;
}) {
  const left = trip.seats.filter((s) => !s.bookingId).length;
  const hotels = parseHotelLinks(trip.hotelLinks);
  const rating = agencyRating(trip.agency.reviews);
  const { days, nights } = tripDurationNights(trip.departureAt, trip.returnAt);
  const photo =
    trip.media?.find((m) => m.kind === "PHOTO")?.url || destinationImage(trip.toDestination);
  const deposit = trip.depositAmount ?? applyBps(trip.pricePerSeat, depositBps);
  const remaining = trip.remainingAmount ?? trip.pricePerSeat - deposit;
  const full = left === 0;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="card card-hover grid overflow-hidden rounded-3xl sm:grid-cols-[16rem_1fr]"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt={trip.toDestination} className="h-44 w-full object-cover sm:h-full" />
      <div className="grid gap-4 p-5 sm:grid-cols-[1fr_auto]">
        <div>
          <p className="text-xs tracking-[0.25em] text-moss">
            {trip.fromCity} → {trip.toDestination}
          </p>
          <h2 className="display mt-1 text-2xl sm:text-3xl">{trip.title}</h2>
          <p className="mt-2 text-sm text-ink/70">
            {formatDate(trip.departureAt, locale)} — {formatDate(trip.returnAt, locale)}
            <span className="text-ink/45">
              {" "}
              · {days} Days / {nights} Nights
            </span>
          </p>
          <p className="mt-2 text-sm text-ink/70">
            {trip.agency.businessName}
            {trip.agency.status === "APPROVED" ? (
              <span className="ms-2 inline-flex rounded-full bg-moss/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-moss">
                ✓ TTN Verified
              </span>
            ) : null}
            {rating ? <span className="ms-2">⭐ {rating.toFixed(1)}</span> : null}
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-sand px-2.5 py-1">{trip.vehicleType}</span>
            <span className="rounded-full bg-sand px-2.5 py-1">{hotels.length ? "✓ Hotel" : "Hotel not listed"}</span>
            <span className="rounded-full bg-sand px-2.5 py-1">
              {trip.mealsIncluded ? "✓ Meals" : "Meals not included"}
            </span>
            <span className="rounded-full bg-sand px-2.5 py-1">✓ Transport</span>
            {trip.familyFriendly ? <span className="rounded-full bg-sand px-2.5 py-1">Family-friendly</span> : null}
          </div>
        </div>
        <div className="text-left sm:text-right">
          <p className="display text-3xl">{pkr(trip.pricePerSeat)}</p>
          <p className="text-sm text-ink/60">/ person</p>
          <p className="mt-2 text-sm text-ink/70">Pay {pkr(deposit)} to reserve</p>
          <p className="text-xs text-ink/50">Remaining {pkr(remaining)}</p>
          <p className={`mt-2 text-sm font-medium ${full ? "text-red-800" : "text-moss"}`}>
            {full ? "Sold out" : `${left} seats remaining`}
          </p>
          <span className="btn-pine mt-3 inline-flex rounded-full px-4 py-2 text-sm">View Trip</span>
        </div>
      </div>
    </Link>
  );
}
