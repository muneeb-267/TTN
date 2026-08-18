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

export default async function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await releaseExpiredHolds();
  const locale = await getLocale();
  const user = await getSession();
  const copy = t(locale);
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      agency: { include: { reviews: true, media: true } },
      seats: { orderBy: [{ row: "asc" }, { col: "asc" }] },
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
  const gallery = [
    ...trip.media,
    ...trip.agency.media.filter((m) => isPublicTripMedia(m.kind, m.isPreviousTrip)),
  ]
    .filter((m) => m.kind === "PHOTO" || m.kind === "VIDEO")
    .slice(0, 8);

  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <p className="text-xs tracking-[0.3em] text-moss">
            {trip.fromCity} → {trip.toDestination}
          </p>
          <h1 className="display mt-2 text-5xl">{trip.title}</h1>
          <p className="mt-3 text-ink/70">
            {trip.agency.businessName}
            {rating ? ` · ${rating.toFixed(1)}★ from completed trips` : ""}
          </p>
          <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
            <div className="rounded-2xl bg-white/70 p-4">
              <dt className="text-ink/50">Departure</dt>
              <dd>{formatDateTime(trip.departureAt, locale)}</dd>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <dt className="text-ink/50">Return</dt>
              <dd>{formatDateTime(trip.returnAt, locale)}</dd>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <dt className="text-ink/50">{copy.vehicle}</dt>
              <dd>
                {trip.vehicleType} · {trip.vehicleDetail}
              </dd>
            </div>
            <div className="rounded-2xl bg-white/70 p-4">
              <dt className="text-ink/50">Fare</dt>
              <dd>{pkr(trip.pricePerSeat)} / seat · TTN keeps 2.5%</dd>
            </div>
          </dl>
          <article className="mt-6 whitespace-pre-wrap text-ink/80">{trip.itinerary}</article>
          {hotels.length ? (
            <div className="mt-6">
              <h2 className="display text-2xl">{copy.hotels}</h2>
              <ul className="mt-2 space-y-1">
                {hotels.map((h) => (
                  <li key={h.url}>
                    <a href={h.url} className="text-link underline" target="_blank" rel="noreferrer">
                      {h.name}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
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
                <Link href="/traveler/login" className="text-link underline">
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
            <p className="mb-4 text-sm text-ink/60">Only after a completed trip. Travelers can add photos.</p>
            <div className="space-y-3">
              {trip.reviews.map((r) => (
                <div key={r.id} className="rounded-2xl bg-sand/60 p-4">
                  <p className="text-sm font-medium">
                    {r.traveler.name} · {"★".repeat(r.rating)}
                  </p>
                  <p className="mt-1 text-ink/80">{r.body}</p>
                  {r.photos.length ? (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {r.photos.map((p) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          key={p.id}
                          src={p.url}
                          alt={p.caption || "Review photo"}
                          className="h-24 w-full rounded-xl object-cover"
                        />
                      ))}
                    </div>
                  ) : null}
                </div>
              ))}
              {!trip.reviews.length ? <p className="text-sm text-ink/50">No completed-trip reviews yet.</p> : null}
            </div>
          </section>
        </div>
        <div>
          <TripSeatPicker
            tripId={trip.id}
            seats={trip.seats.map((s) => ({
              code: s.code,
              row: s.row,
              col: s.col,
              aisleAfter: s.aisleAfter,
              taken: Boolean(s.bookingId),
            }))}
          />
          <p className="mt-4 text-center text-xs text-ink/50">
            Book 6–7 days ahead to pay 50% now. Remaining is due one day before departure.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
