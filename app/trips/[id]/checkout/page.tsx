import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import { quoteBooking } from "@/lib/booking";
import { PageShell } from "@/components/shell";
import { CheckoutForm } from "@/components/booking-forms";
import { SeatMap } from "@/components/seat-map";
import { PlaceFrame } from "@/components/place-media";
import { tripCoverImage } from "@/lib/media";
import { getFinanceRates, travelerPayOptions } from "@/lib/platform-fees";
import { applyBps, effectiveCardProcessingBps, formatBps } from "@/lib/money";
import { instantPayMethods, releaseExpiredHolds } from "@/lib/payments";

export default async function CheckoutPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ seats?: string }>;
}) {
  const { id } = await params;
  await releaseExpiredHolds();
  const { seats: seatsQuery } = await searchParams;
  const session = await getSession();
  if (!session) redirect(`/traveler/login`);
  if (session.role !== "TRAVELER") redirect("/trips");
  const locale = await getLocale();
  const codes = (seatsQuery || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: { seats: true, agency: true, media: true },
  });
  if (!trip) notFound();
  if (!trip.published || trip.agency.status !== "APPROVED") notFound();
  if (trip.departureAt <= new Date()) redirect(`/trips/${id}`);
  const pay = await travelerPayOptions(trip, trip.agency);
  if (!codes.length) redirect(`/trips/${id}`);
  const rates = await getFinanceRates();
  const quote = quoteBooking(trip.pricePerSeat, codes.length, trip.departureAt, {
    ...rates,
    processingFeeBps: 0,
    depositBps: trip.depositBps || rates.depositBps,
  });
  const cardProcessingBps = effectiveCardProcessingBps(rates.processingFeeBps);
  const cardProcessingFee = applyBps(quote.totalPrice, cardProcessingBps);

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-2">
        <div>
          <Link href={`/trips/${id}`} className="text-link text-sm">
            ← Back to seats
          </Link>
          <PlaceFrame src={tripCoverImage(trip)} alt={trip.title} className="mt-6 h-48" />
          <h1 className="display mt-3 text-4xl">Confirm your seats</h1>
          <p className="mt-2 text-ink/70">
            {trip.title} ·{" "}
            <Link href={`/agencies/${trip.agencyId}`} className="text-link">
              {trip.agency.businessName}
            </Link>
          </p>
          <p className="mt-1 text-sm">
            {formatDateTime(trip.departureAt, locale)} from {trip.fromCity}
          </p>
          <div className="mt-6">
            <SeatMap
              readOnly
              selected={codes}
              seats={trip.seats.map((s) => ({
                code: s.code,
                row: s.row,
                col: s.col,
                aisleAfter: s.aisleAfter,
                taken: Boolean(s.bookingId) && !codes.includes(s.code),
              }))}
            />
          </div>
        </div>
        <CheckoutForm
          tripId={trip.id}
          seats={codes}
          depositAmount={quote.depositAmount}
          remainingAmount={quote.remainingAmount}
          totalPrice={quote.totalPrice}
          platformFee={quote.platformFee}
          processingFee={0}
          cardProcessingFee={cardProcessingFee}
          cardProcessingLabel={formatBps(cardProcessingBps)}
          commissionLabel={formatBps(quote.commissionBps)}
          holdMinutes={rates.seatHoldMinutes}
          remainingDue={formatDate(quote.remainingDueAt, locale)}
          fullPay={!quote.depositEligible}
          instantMethods={instantPayMethods({
            cardSplits: Boolean(trip.agency.stripePayoutsReady) && !pay.diverted,
          })}
          manualMethods={pay.methods}
          agencyName={trip.agency.businessName}
          diverted={pay.diverted}
        />
      </div>
    </PageShell>
  );
}
