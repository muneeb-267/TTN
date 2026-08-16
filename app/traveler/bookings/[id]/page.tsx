import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatDate, formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { inputClass } from "@/components/fields";
import { RemainingPayForm, RefundForm } from "@/components/booking-forms";
import { SeatMap } from "@/components/seat-map";
import { addTripReview } from "@/app/actions/trips";
import { cancelSplit } from "@/lib/booking";

export default async function BookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") redirect("/traveler/login");
  const locale = await getLocale();
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      trip: { include: { seats: true, agency: true } },
      seats: true,
      refund: true,
      review: true,
      payments: true,
    },
  });
  if (!booking || booking.travelerId !== session.id) notFound();
  const split = cancelSplit(booking.depositAmount, booking.bookedAt);
  const canReview =
    !booking.review &&
    ["FULLY_PAID", "COMPLETED"].includes(booking.status) &&
    new Date() >= booking.trip.returnAt;

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <p className="text-xs tracking-widest text-moss">{booking.publicRef}</p>
        <h1 className="display text-4xl">{booking.trip.title}</h1>
        <p className="mt-2 text-ink/70">{booking.trip.agency.businessName}</p>
        <p className="text-sm">{formatDateTime(booking.trip.departureAt, locale)}</p>
        <div className="my-6">
          <SeatMap
            readOnly
            seats={booking.trip.seats.map((s) => ({
              code: s.code,
              row: s.row,
              col: s.col,
              aisleAfter: s.aisleAfter,
              taken: Boolean(s.bookingId) && s.bookingId !== booking.id,
              mine: s.bookingId === booking.id,
            }))}
          />
        </div>
        <div className="card space-y-2 rounded-3xl p-5 text-sm">
          <p>Status: {booking.status.replaceAll("_", " ")}</p>
          <p>Deposit paid: {pkr(booking.depositAmount)}</p>
          <p>
            Remaining: {pkr(booking.remainingAmount)} · due {formatDate(booking.remainingDueAt, locale)}
          </p>
          <p>TTN 5% on this booking: {pkr(booking.platformFee)}</p>
          <Link href={`/traveler/bookings/${booking.id}/slip`} className="text-link inline-block">
            View 50% payment slip →
          </Link>
        </div>

        {booking.status === "DEPOSIT_PAID" ? (
          <div className="mt-8 card rounded-3xl p-5">
            <h2 className="display text-2xl">Pay the rest one day before</h2>
            <p className="mb-4 mt-1 text-sm text-ink/70">
              Cover the remaining {pkr(booking.remainingAmount)} before{" "}
              {formatDate(booking.remainingDueAt, locale)}.
            </p>
            <RemainingPayForm bookingId={booking.id} amount={booking.remainingAmount} />
          </div>
        ) : null}

        {["DEPOSIT_PAID", "FULLY_PAID"].includes(booking.status) ? (
          <div className="mt-8 card rounded-3xl p-5">
            <h2 className="display text-2xl">Need to back off?</h2>
            <p className="mb-4 mt-1 text-sm text-ink/70">
              Within 24 hours: the agency must refund you in full. If they refuse, TTN fines them
              one seat fare on this trip ({pkr(booking.trip.pricePerSeat)}). After 24 hours: TTN
              keeps {pkr(split.platformKeep)} (15% of the half) and the agency keeps{" "}
              {pkr(split.agencyKeep)}. You get {pkr(split.travelerRefund)} back (20%).
            </p>
            <RefundForm bookingId={booking.id} />
          </div>
        ) : null}

        {booking.refund ? (
          <div className="mt-8 rounded-3xl bg-sand p-5 text-sm">
            Refund {booking.refund.status.toLowerCase()} · traveler {pkr(booking.refund.travelerRefund)}{" "}
            · TTN {pkr(booking.refund.platformKeep)}
            {booking.refund.agencyFine
              ? ` · agency fined ${pkr(booking.refund.agencyFine)} (one seat)`
              : ""}
            {booking.refund.agencyNote ? ` · ${booking.refund.agencyNote}` : ""}
          </div>
        ) : null}

        {canReview ? (
          <form action={addTripReview.bind(null, booking.id)} className="card mt-8 space-y-3 rounded-3xl p-5">
            <h2 className="display text-2xl">Review after the trip</h2>
            <select name="rating" className={inputClass} defaultValue="5">
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>
                  {n} stars
                </option>
              ))}
            </select>
            <textarea name="body" className={inputClass} rows={3} placeholder="How was the vehicle, hotels, timing?" />
            <button className="btn-pine rounded-full px-4 py-2">Submit review</button>
          </form>
        ) : null}
      </div>
    </PageShell>
  );
}
