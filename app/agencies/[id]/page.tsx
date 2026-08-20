import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { formatDate, formatDateTime } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { PlaceHero, PlaceLinkCard } from "@/components/place-media";
import { AgencyCommentForm, AgencyReviewForm } from "@/components/agency-social";
import { agencyAvatar, isProfilePost, tripCoverImage } from "@/lib/media";
import { agencyRating } from "@/lib/trip-query";
import { SCENE } from "@/lib/destinations";

export default async function AgencyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const locale = await getLocale();
  const user = await getSession();
  const copy = t(locale);
  const agency = await prisma.agency.findUnique({
    where: { id },
    include: {
      user: true,
      reviews: {
        include: { traveler: true, photos: true, booking: true, trip: true },
        orderBy: { createdAt: "desc" },
      },
      comments: {
        where: { tripId: null },
        include: { user: true },
        orderBy: { createdAt: "desc" },
      },
      media: { orderBy: { id: "desc" } },
      trips: {
        where: { published: true, departureAt: { gte: new Date() } },
        include: { seats: true, media: true },
        orderBy: { departureAt: "asc" },
      },
    },
  });
  if (!agency || agency.status !== "APPROVED") notFound();

  const posts = agency.media.filter(isProfilePost);
  const banner = posts.find((m) => m.kind === "PHOTO")?.url || agencyAvatar(agency) || SCENE.karakoram;
  const rating = agencyRating(agency.reviews);
  const isOwner = user?.role === "AGENCY" && user.id === agency.userId;
  const ownReview = user ? agency.reviews.find((r) => r.travelerId === user.id) : null;

  return (
    <PageShell locale={locale} user={user}>
      <PlaceHero
        image={banner}
        kicker={agency.city}
        title={agency.businessName}
        subtitle="Previous trips, photos, reviews and comments — the agency’s public page."
        compact
      />
      <div className="mx-auto max-w-4xl px-4 py-10">
        <div className="flex flex-col items-center text-center sm:flex-row sm:items-start sm:text-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={agencyAvatar(agency)} alt="" className="ig-avatar" />
          <div className="mt-4 min-w-0 sm:mt-0 sm:ms-6 sm:flex-1">
            <h1 className="display text-4xl text-pine">{agency.businessName}</h1>
            <p className="mt-1 text-sm text-ink/65">
              {agency.city}
              {agency.status === "APPROVED" ? " · ✓ TTN Verified" : ""}
              {rating ? ` · ⭐ ${rating.toFixed(1)} (${agency.reviews.length})` : ""}
            </p>
            <p className="mt-3 text-sm text-ink/80">
              <span className="font-semibold">{posts.length}</span> posts ·{" "}
              <span className="font-semibold">{agency.trips.length}</span> upcoming trips ·{" "}
              <span className="font-semibold">{agency.reviews.length}</span> reviews
            </p>
            <p className="mt-4 max-w-xl whitespace-pre-wrap text-ink/80">{agency.about}</p>
            {isOwner ? (
              <Link href="/agency/gallery" className="btn-gold mt-4 inline-flex rounded-full px-4 py-2 text-sm font-semibold">
                Edit profile
              </Link>
            ) : null}
          </div>
        </div>

        {agency.trips.length ? (
          <section className="mt-10">
            <h2 className="display text-3xl">Upcoming trips</h2>
            <div className="mt-4 grid gap-3">
              {agency.trips.map((trip) => (
                <PlaceLinkCard
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  image={tripCoverImage(trip)}
                  kicker={`${trip.fromCity} → ${trip.toDestination}`}
                  title={trip.title}
                  body={formatDate(trip.departureAt, locale)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="mt-10">
          <h2 className="display text-3xl">Previous trips</h2>
          <p className="mt-2 text-sm text-ink/60">Photos and videos the agency posted from the road.</p>
          {posts.length ? (
            <div className="ig-grid mt-4">
              {posts.map((m) => (
                <div key={m.id} className="ig-cell">
                  {m.kind === "VIDEO" ? (
                    <video src={m.url} controls playsInline />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.url} alt={m.caption || "Previous trip"} />
                  )}
                  {m.caption ? <span className="ig-caption">{m.caption}</span> : null}
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/50">No posts yet.</p>
          )}
        </section>

        <section className="mt-12">
          <h2 className="display text-3xl">{copy.reviews}</h2>
          <p className="mb-4 mt-2 text-sm text-ink/60">Anyone with a TTN account can review this agency.</p>
          {user && !isOwner ? (
            <AgencyReviewForm
              agencyId={agency.id}
              existing={ownReview ? { rating: ownReview.rating, body: ownReview.body } : null}
            />
          ) : null}
          {!user ? (
            <p className="mb-4 text-sm">
              <Link href="/signin" className="text-link underline">
                Sign in
              </Link>{" "}
              to leave a review.
            </p>
          ) : null}
          <div className="mt-5 space-y-3">
            {agency.reviews.map((r) => (
              <div key={r.id} className="rounded-2xl bg-sand/60 p-4">
                <p className="text-sm font-medium">
                  {r.traveler.name} · {"★".repeat(r.rating)}
                  {r.booking ? (
                    <span className="ms-2 text-[10px] font-semibold tracking-wide text-moss">
                      Verified Booking
                    </span>
                  ) : (
                    <span className="ms-2 text-[10px] font-semibold tracking-wide text-moss">Traveler</span>
                  )}
                </p>
                {r.trip ? <p className="text-xs text-ink/50">{r.trip.title}</p> : null}
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
            {!agency.reviews.length ? <p className="text-sm text-ink/50">No reviews yet.</p> : null}
          </div>
        </section>

        <section className="mt-12">
          <h2 className="display text-3xl">{copy.comments}</h2>
          <p className="mb-4 mt-2 text-sm text-ink/60">Ask the agency about past trips — like comments on a profile.</p>
          {user ? (
            <AgencyCommentForm agencyId={agency.id} />
          ) : (
            <p className="mb-4 text-sm">
              <Link href="/signin" className="text-link underline">
                Sign in
              </Link>{" "}
              to comment.
            </p>
          )}
          <div className="space-y-3">
            {agency.comments.map((c) => (
              <div key={c.id} className="rounded-2xl border border-ink/10 bg-white/70 p-4">
                <p className="text-xs text-ink/50">
                  {c.user.name}
                  {c.userId === agency.userId ? " · Agency" : ""} · {formatDateTime(c.createdAt, locale)}
                </p>
                <p className="mt-1">{c.body}</p>
              </div>
            ))}
            {!agency.comments.length ? <p className="text-sm text-ink/50">No comments yet.</p> : null}
          </div>
        </section>
      </div>
    </PageShell>
  );
}
