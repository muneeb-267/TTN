import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { formatDateTime, parseHotelLinks, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { inputClass } from "@/components/fields";
import { TripSeatPicker } from "@/components/trip-seat-picker";
import { addComment } from "@/app/actions/trips";
import { isPublicTripMedia } from "@/lib/media";
import { releaseExpiredHolds } from "@/lib/payments";
import { quoteBooking } from "@/lib/booking";
import { getFinanceRates } from "@/lib/platform-fees";
import { formatBps } from "@/lib/money";
import { destinationGallery, destinationImage, tripDurationNights } from "@/lib/destinations";
import { COMPLAINTS_EMAIL } from "@/lib/constants";

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await releaseExpiredHolds();
  const locale = await getLocale();
  const user = await getSession();
  const copy = t(locale);
  const rates = await getFinanceRates();
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      agency: { include: { reviews: true, media: true } },
      seats: { include: { booking: { select: { status: true, holdUntil: true } } }, orderBy: [{ row: "asc" }, { col: "asc" }] },
      comments: { include: { user: true }, orderBy: { createdAt: "desc" } },
      media: true,
      reviews: { include: { traveler: true, photos: true } },
    },
  });
  if (!trip) notFound();
  const isOwner = user?.role === "AGENCY" && user.id === trip.agency.userId;
  const isAdmin = user?.role === "ADMIN";
  if ((!trip.published || trip.agency.status !== "APPROVED") && !isOwner && !isAdmin) notFound();
  const hotels = parseHotelLinks(trip.hotelLinks);
  const rating =
    trip.agency.reviews.length > 0
      ? trip.agency.reviews.reduce((s, r) => s + r.rating, 0) / trip.agency.reviews.length
      : 0;
  const ownPhotos = trip.media.filter((m) => m.kind === "PHOTO" || m.kind === "VIDEO");
  const placeShots = destinationGallery(trip.toDestination).map((url, i) => ({
    id: `place-${trip.toDestination}-${i}`,
    url,
    kind: "PHOTO" as const,
    caption: trip.toDestination,
  }));
  const gallery = [
    ...ownPhotos,
    ...placeShots,
    ...trip.agency.media.filter((m) => isPublicTripMedia(m.kind, m.isPreviousTrip)),
  ]
    .filter((m) => m.kind === "PHOTO" || m.kind === "VIDEO")
    .slice(0, 8);
  const quote = quoteBooking(trip.pricePerSeat, 1, trip.departureAt, {
    ...rates,
    depositBps: trip.depositBps || rates.depositBps,
  });
  const left = trip.seats.filter((s) => !s.bookingId).length;
  const { days, nights } = tripDurationNights(trip.departureAt, trip.returnAt);
  const hero = ownPhotos.find((m) => m.kind === "PHOTO")?.url || destinationImage(trip.toDestination);
  const included = safeList(trip.includedJson);
  const excluded = safeList(trip.excludedJson);

  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="place-frame overflow-hidden rounded-[32px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={hero} alt={trip.title} className="h-56 w-full object-cover sm:h-80" />
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <p className="text-xs tracking-[0.3em] text-moss">
              {trip.fromCity} → {trip.toDestination}
            </p>
            <h1 className="display mt-2 text-4xl sm:text-5xl">{trip.title}</h1>
            <p className="mt-3 text-ink/70">
              {trip.agency.businessName}
              {trip.agency.status === "APPROVED" ? " · ✓ TTN Verified" : ""}
              {rating ? ` · ⭐ ${rating.toFixed(1)}` : ""}
            </p>
            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <Info label="Dates" value={`${formatDateTime(trip.departureAt, locale)} → ${formatDateTime(trip.returnAt, locale)}`} />
              <Info label="Duration" value={`${days} days / ${nights} nights`} />
              <Info label={copy.vehicle} value={`${trip.vehicleType} · ${trip.vehicleDetail}`} />
              <Info label="Available seats" value={`${left} of ${trip.seatCount}`} />
            </dl>
            {gallery.length ? (
              <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {gallery.map((m) =>
                  m.kind === "VIDEO" ? (
                    <video key={m.id} src={m.url} controls className="h-36 w-full rounded-2xl object-cover" />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={m.id} src={m.url} alt={m.caption} className="h-36 w-full rounded-2xl object-cover" />
                  ),
                )}
              </div>
            ) : null}
            <article className="mt-8">
              <h2 className="display text-3xl">Itinerary</h2>
              <p className="mt-3 whitespace-pre-wrap text-ink/80">{trip.itinerary}</p>
            </article>
            {trip.meetingPoint ? (
              <article className="mt-8">
                <h2 className="display text-2xl">Meeting point</h2>
                <p className="mt-2 text-ink/80">{trip.meetingPoint}</p>
              </article>
            ) : null}
            {hotels.length ? (
              <div className="mt-8">
                <h2 className="display text-2xl">{copy.hotels}</h2>
                <ul className="mt-2 space-y-1">
                  {hotels.map((h) => (
                    <li key={`${h.name}-${h.url}`}>
                      {h.url ? (
                        <a href={h.url} className="text-link underline" target="_blank" rel="noreferrer">
                          {h.name}
                        </a>
                      ) : (
                        <span>{h.name}</span>
                      )}
                      {h.rooms ? <span className="text-ink/60"> · {h.rooms}</span> : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <h2 className="display text-2xl">What’s included</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/75">
                  {(included.length ? included : ["Transport as listed", hotels.length ? "Hotel stay" : null, trip.mealsIncluded ? "Meals as described" : null].filter(Boolean) as string[]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
              <div>
                <h2 className="display text-2xl">What’s not included</h2>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/75">
                  {(excluded.length ? excluded : ["Personal expenses", "Anything not listed in the itinerary"]).map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
            {trip.importantInfo ? (
              <article className="mt-8">
                <h2 className="display text-2xl">Important information</h2>
                <p className="mt-2 whitespace-pre-wrap text-ink/80">{trip.importantInfo}</p>
              </article>
            ) : null}
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="card rounded-3xl p-5">
                <h2 className="display text-2xl">Cancellation</h2>
                <p className="mt-2 text-sm text-ink/70">
                  {trip.cancelPolicyJson ||
                    "Within 24 hours of booking: full deposit refund if the agency approves. After 24 hours: of the deposit, traveler 20%, agency 15%, TTN 15% — until remaining payment is made."}
                </p>
                <Link href="/legal/cancellation" className="text-link mt-2 inline-block text-sm">
                  Platform cancellation policy
                </Link>
              </div>
              <div className="card rounded-3xl p-5">
                <h2 className="display text-2xl">Refunds</h2>
                <p className="mt-2 text-sm text-ink/70">
                  Refunds are calculated from the amount already paid. You see the amount before you confirm a cancellation.
                </p>
                <Link href="/legal/refunds" className="text-link mt-2 inline-block text-sm">
                  Refund policy
                </Link>
              </div>
            </div>
            <p className="mt-6 text-sm text-ink/60">
              Need help?{" "}
              <a className="text-link" href={`mailto:${COMPLAINTS_EMAIL}`}>
                {COMPLAINTS_EMAIL}
              </a>
              {" · "}
              <Link href={`/support?trip=${trip.id}`} className="text-link">
                Report this trip
              </Link>
            </p>

            <section className="mt-10">
              <h2 className="display text-3xl">{copy.comments}</h2>
              <p className="mb-4 text-sm text-ink/60">Travelers and agencies can both write here.</p>
              {user ? (
                <form action={addComment.bind(null, trip.id)} className="mb-6 flex flex-col gap-3">
                  <textarea name="body" required className={inputClass} rows={3} placeholder="Ask about the vehicle, hotels, food…" />
                  <button className="btn-pine self-start rounded-full px-4 py-2">Post comment</button>
                </form>
              ) : (
                <p className="mb-4 text-sm">
                  <Link href="/signin" className="text-link underline">
                    Sign in
                  </Link>{" "}
                  to comment.
                </p>
              )}
              <div className="space-y-3">
                {trip.comments.map((c) => (
                  <div key={c.id} className="rounded-2xl border border-ink/10 bg-white/70 p-4">
                    <p className="text-xs text-ink/50">
                      {c.user.name} · {c.user.role === "AGENCY" ? "Agency" : "Traveler"}
                    </p>
                    <p className="mt-1">{c.body}</p>
                  </div>
                ))}
              </div>
            </section>

            <section className="mt-10">
              <h2 className="display text-3xl">{copy.reviews}</h2>
              <p className="mb-4 text-sm text-ink/60">Verified booking reviews after a completed trip.</p>
              <div className="space-y-3">
                {trip.reviews.map((r) => (
                  <div key={r.id} className="rounded-2xl bg-sand/60 p-4">
                    <p className="text-sm font-medium">
                      {r.traveler.name} · {"★".repeat(r.rating)}{" "}
                      <span className="ms-2 text-[10px] font-semibold tracking-wide text-moss">Verified Booking</span>
                    </p>
                    <p className="mt-1 text-ink/80">{r.body}</p>
                    {r.photos.length ? (
                      <div className="mt-3 grid grid-cols-3 gap-2">
                        {r.photos.map((p) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={p.id} src={p.url} alt={p.caption || "Review photo"} className="h-24 w-full rounded-xl object-cover" />
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
                {!trip.reviews.length ? <p className="text-sm text-ink/50">No reviews yet</p> : null}
              </div>
            </section>
          </div>
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="card rounded-3xl p-6">
              <p className="display text-4xl">{pkr(trip.pricePerSeat)}</p>
              <p className="text-sm text-ink/60">/ person</p>
              <ul className="mt-4 space-y-2 text-sm">
                <li className="flex justify-between">
                  <span>Initial payment</span>
                  <span>{pkr(quote.depositAmount)}</span>
                </li>
                <li className="flex justify-between">
                  <span>Remaining</span>
                  <span>{pkr(quote.remainingAmount)}</span>
                </li>
                <li className="flex justify-between text-ink/55">
                  <span>TTN commission ({formatBps(quote.commissionBps)})</span>
                  <span>{pkr(quote.platformFee)}</span>
                </li>
                {quote.processingFee ? (
                  <li className="flex justify-between text-ink/55">
                    <span>Payment processing</span>
                    <span>{pkr(quote.processingFee)}</span>
                  </li>
                ) : null}
              </ul>
              <p className="mt-3 text-xs text-ink/50">
                Commission is included in the fare, not added on top. Seats are held for {rates.seatHoldMinutes} minutes at checkout.
              </p>
            </div>
            <div className="mt-4">
              <TripSeatPicker
                tripId={trip.id}
                pricePerSeat={trip.pricePerSeat}
                depositPerSeat={quote.depositAmount}
                seats={trip.seats.map((s) => ({
                  code: s.code,
                  row: s.row,
                  col: s.col,
                  aisleAfter: s.aisleAfter,
                  taken: Boolean(s.bookingId) && s.booking?.status !== "AWAITING_PAYMENT",
                  held: s.booking?.status === "AWAITING_PAYMENT",
                }))}
              />
            </div>
          </aside>
        </div>
      </div>
    </PageShell>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <dt className="text-ink/50">{label}</dt>
      <dd className="mt-1">{value}</dd>
    </div>
  );
}

function safeList(raw: string) {
  try {
    const value = JSON.parse(raw) as unknown;
    return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}
