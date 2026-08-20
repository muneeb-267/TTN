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
import { travelerPayOptions } from "@/lib/platform-fees";

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
      review: { include: { photos: true } },
      payments: true,
    },
  });
  if (!booking || booking.travelerId !== session.id) notFound();
  const pay = await travelerPayOptions(booking.trip, booking.trip.agency);
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
          <p>Gross: {pkr(booking.totalPrice)}</p>
          <p>Deposit: {pkr(booking.depositAmount)}</p>
          <p>
            Remaining: {pkr(booking.remainingAmount)} · due {formatDate(booking.remainingDueAt, locale)}
          </p>
          <p>
            TTN commission ({booking.commissionBps / 100}% snapshotted): {pkr(booking.platformFee)}
          </p>
          <p>Payment processing fee: {pkr(booking.processingFee)}</p>
          <p>Agency settlement: {pkr(booking.agencySettlement)}</p>
          <p>Refunded: {pkr(booking.refundAmount)}</p>
          <p>TTN net (this booking): {pkr(booking.netRevenue)}</p>
          {booking.status === "AWAITING_PAYMENT" ? (
            <Link href={`/traveler/bookings/${booking.id}/pay`} className="text-link inline-block">
              Complete payment →
            </Link>
          ) : (
            <Link href={`/traveler/bookings/${booking.id}/slip`} className="text-link inline-block">
              View payment slip →
            </Link>
          )}
          <Link href={`/support?booking=${booking.id}`} className="text-link block">
            Need help with this booking?
          </Link>
        </div>
        <ol className="mt-8 space-y-2 text-sm">
          {[
            ["Booking created", true],
            ["Seats reserved", Boolean(booking.seats.length)],
            ["Initial payment received", Boolean(booking.depositPaidAt)],
            ["Booking confirmed", ["DEPOSIT_PAID", "FULLY_PAID", "COMPLETED"].includes(booking.status)],
            ["Remaining payment", Boolean(booking.remainingPaidAt) || booking.remainingAmount === 0],
            ["Trip departure", new Date() >= booking.trip.departureAt],
            ["Trip completed", booking.status === "COMPLETED" || new Date() >= booking.trip.returnAt],
            ["Review", Boolean(booking.review)],
          ].map(([label, done]) => (
            <li key={String(label)} className={done ? "text-moss" : "text-ink/40"}>
              {done ? "✓" : "○"} {label}
            </li>
          ))}
        </ol>

        {booking.status === "DEPOSIT_PAID" ? (
          <div className="mt-8 card rounded-3xl p-5">
            <h2 className="display text-2xl">Pay the rest one day before</h2>
            <p className="mb-4 mt-1 text-sm text-ink/70">
              Cover the remaining {pkr(booking.remainingAmount)} before{" "}
              {formatDate(booking.remainingDueAt, locale)}.
            </p>
            <RemainingPayForm
              bookingId={booking.id}
              amount={booking.remainingAmount}
              methods={pay.methods}
            />
          </div>
        ) : null}

        {booking.status === "DEPOSIT_PAID" && !booking.refund ? (
          <div className="mt-8 card rounded-3xl p-5">
            <h2 className="display text-2xl">Need to back off?</h2>
            <p className="mb-4 mt-1 text-sm text-ink/70">
              Refunds are only possible before you pay the remaining 50%. Within 24 hours: the
              agency must refund you in full. If they refuse, TTN fines them one seat fare on this
              trip ({pkr(booking.trip.pricePerSeat)}). After 24 hours: TTN keeps{" "}
              {pkr(split.platformKeep)} (15% of the half) and the agency keeps {pkr(split.agencyKeep)}.
              You get {pkr(split.travelerRefund)} back (20%). Give the account where they should
              send the money.
            </p>
            <RefundForm bookingId={booking.id} />
          </div>
        ) : null}

        {booking.status === "FULLY_PAID" && !booking.refund ? (
          <p className="mt-8 text-sm text-ink/60">
            This booking is paid in full, so a refund cannot be requested.
          </p>
        ) : null}

        {booking.refund ? (
          <div className="mt-8 rounded-3xl bg-sand p-5 text-sm">
            Refund {booking.refund.status.toLowerCase()} · traveler {pkr(booking.refund.travelerRefund)}{" "}
            · TTN {pkr(booking.refund.platformKeep)}
            {booking.refund.agencyFine
              ? ` · agency fined ${pkr(booking.refund.agencyFine)} (one seat)`
              : ""}
            {booking.refund.agencyNote ? ` · ${booking.refund.agencyNote}` : ""}
            {booking.refund.payoutAccountNo ? (
              <span>
                {" "}
                · payout {booking.refund.payoutMethod} {booking.refund.payoutAccountName}{" "}
                {booking.refund.payoutAccountNo}
                {booking.refund.payoutBank ? ` (${booking.refund.payoutBank})` : ""}
              </span>
            ) : null}
          </div>
        ) : null}

        {booking.review ? (
          <div className="card mt-8 space-y-2 rounded-3xl p-5">
            <h2 className="display text-2xl">Your review</h2>
            <p className="text-sm">{"★".repeat(booking.review.rating)}</p>
            <p className="text-sm text-ink/80">{booking.review.body}</p>
            {booking.review.photos.length ? (
              <div className="grid grid-cols-3 gap-2 pt-2">
                {booking.review.photos.map((p) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img key={p.id} src={p.url} alt={p.caption} className="h-24 w-full rounded-xl object-cover" />
                ))}
              </div>
            ) : null}
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
            <label className="block space-y-1.5">
              <span className="text-sm font-medium text-ink/80">Review pictures</span>
              <input name="photos" type="file" accept="image/*" multiple className={inputClass} />
            </label>
            <button className="btn-pine rounded-full px-4 py-2">Submit review</button>
          </form>
        ) : null}
      </div>
    </PageShell>
  );
}
