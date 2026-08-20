import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { TripCard } from "@/components/trip-card";
import { HomeHero3D } from "@/components/home-hero-3d";
import { prisma } from "@/lib/prisma";
import { CITIES, DESTINATIONS } from "@/lib/constants";
import { DISCOVER_DESTINATIONS, SCENE } from "@/lib/destinations";
import { getFinanceRates } from "@/lib/platform-fees";
import { agencyRating, durationDays } from "@/lib/trip-query";
import { PlaceFrame } from "@/components/place-media";
import { agencyAvatar } from "@/lib/media";

export default async function HomePage() {
  const locale = await getLocale();
  const user = await getSession();
  const copy = t(locale);
  const rates = await getFinanceRates();
  const trips = await prisma.trip.findMany({
    where: { published: true, departureAt: { gte: new Date() }, agency: { status: "APPROVED" } },
    include: { agency: { include: { reviews: true } }, seats: true, media: true },
    orderBy: { departureAt: "asc" },
    take: 24,
  });
  const agencies = await prisma.agency.findMany({
    where: { status: "APPROVED" },
    include: { reviews: true, trips: { where: { published: true } }, media: true },
    take: 6,
  });
  const popular = trips.slice(0, 4);
  const bestValue = [...trips].sort((a, b) => a.pricePerSeat / durationDays(a) - b.pricePerSeat / durationDays(b)).slice(0, 4);
  const trending = [...trips].sort((a, b) => b.seats.filter((s) => s.bookingId).length - a.seats.filter((s) => s.bookingId).length).slice(0, 4);

  return (
    <PageShell locale={locale} user={user}>
      <HomeHero3D
        destinations={[...DISCOVER_DESTINATIONS]}
        exploreLabel={copy.explore}
        signInLabel={copy.signIn}
        signedIn={Boolean(user)}
      />

      <section id="trips" className="scroll-mt-24 bg-cream">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <p className="text-sm tracking-[0.3em] text-moss">LIVE TRIPS · NO ACCOUNT NEEDED</p>
          <h2 className="display mt-2 text-4xl sm:text-5xl">Find your next departure</h2>
          <p className="mt-3 max-w-2xl text-ink/70">
            Compare northern Pakistan trips from verified agencies with real dates, real seats and
            transparent pricing. Sign in only when you are ready to book.
          </p>
          <form
            action="/trips"
            method="get"
            className="mt-8 grid gap-3 rounded-3xl bg-white/80 p-4 text-ink shadow-xl sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_8rem_auto]"
          >
            <label className="text-xs text-ink/55">
              Destination
              <select name="to" className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2.5 text-sm">
                <option value="">Anywhere north</option>
                {DESTINATIONS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ink/55">
              Departure city
              <select name="from" className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2.5 text-sm">
                <option value="">Any city</option>
                {CITIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs text-ink/55">
              Travel date
              <input type="date" name="date" className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2.5 text-sm" />
            </label>
            <label className="text-xs text-ink/55">
              Travelers
              <input name="seats" type="number" min={1} max={20} defaultValue={2} className="mt-1 w-full rounded-2xl border border-ink/10 bg-white px-3 py-2.5 text-sm" />
            </label>
            <button className="btn-gold rounded-2xl px-5 py-3 font-semibold lg:mt-5" type="submit">
              Find Trips
            </button>
          </form>
        </div>
        <HomeTripRail title="Popular Trips" trips={popular} locale={locale} depositBps={rates.depositBps} />
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Verified Agencies", "Only approved operators list trips."],
            ["Real Seat Availability", "Cinema-style seats, held then locked."],
            ["Secure Payments", "Instant card / JazzCash, or a transfer with a screenshot."],
            ["Transparent Pricing", `Fare, deposit and ${copy.brand} commission shown separately.`],
          ].map(([title, body]) => (
            <div key={title} className="card rounded-3xl p-5">
              <p className="font-semibold text-pine">{title}</p>
              <p className="mt-1 text-sm text-ink/65">{body}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12">
        <h2 className="display text-4xl">Trending Destinations</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {DISCOVER_DESTINATIONS.map((d) => (
            <Link key={d.name} href={`/trips?to=${encodeURIComponent(d.query)}`} className="group relative overflow-hidden rounded-3xl border-2 border-gold">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={d.image} alt={d.name} className="h-40 w-full object-cover transition duration-500 group-hover:scale-105" />
              <span className="absolute inset-0 bg-gradient-to-t from-pine/80 to-transparent" />
              <span className="display absolute bottom-3 left-3 text-2xl text-sand">{d.name}</span>
            </Link>
          ))}
        </div>
      </section>

      <HomeTripRail title="Best Value Trips" trips={bestValue} locale={locale} depositBps={rates.depositBps} />
      {trending.length ? (
        <HomeTripRail title="Trending now" trips={trending} locale={locale} depositBps={rates.depositBps} />
      ) : null}

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="display text-4xl">Verified Agencies</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {agencies.map((a) => {
            const rating = agencyRating(a.reviews);
            return (
              <Link key={a.id} href={`/agencies/${a.id}`} className="card overflow-hidden rounded-3xl">
                <PlaceFrame src={agencyAvatar(a)} alt={a.businessName} className="h-36 rounded-none border-0" />
                <div className="p-5">
                <p className="display text-2xl text-pine">{a.businessName}</p>
                <p className="mt-1 text-sm text-ink/70">{a.city}</p>
                <p className="mt-3 text-sm text-ink/80">{a.about}</p>
                <p className="mt-3 text-xs font-semibold tracking-wide text-moss">✓ TTN Verified</p>
                {rating ? <p className="mt-1 text-sm">⭐ {rating.toFixed(1)} from travelers</p> : null}
                <p className="mt-1 text-sm text-ink/70">{a.trips.length} listed trips</p>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="bg-pine py-14 text-sand">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 lg:grid-cols-2">
          <div className="place-link-card bg-[#fffdf8] text-ink">
            <PlaceFrame src={SCENE.attabad} alt="Attabad Lake, Hunza" className="h-44 rounded-none border-0 lg:h-full" />
            <div className="p-6">
            <h2 className="display text-4xl text-pine">How TTN Works</h2>
            <ol className="mt-6 space-y-3 text-ink/80">
              <li>1. Discover and compare northern trips with real dates and seats.</li>
              <li>2. Select seats. TTN holds them while you pay the deposit.</li>
              <li>3. Pay the remaining amount before departure.</li>
              <li>4. Travel, then review the agency on their public profile.</li>
            </ol>
            </div>
          </div>
          <div className="place-link-card bg-[#fffdf8] text-ink">
            <PlaceFrame src={SCENE.fairyMeadows} alt="Fairy Meadows and Nanga Parbat" className="h-44 rounded-none border-0 lg:h-full" />
            <div className="p-6">
            <h2 className="display text-4xl text-pine">Why Travelers Choose TTN</h2>
            <ul className="mt-6 space-y-3 text-ink/80">
              <li>Verified agencies, not anonymous Facebook posts.</li>
              <li>Seat maps so you are not sold a seat twice.</li>
              <li>Partial payment to lock, remainder tracked in your dashboard.</li>
              <li>Clear cancellation and refund rules before you pay.</li>
            </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14">
        <div className="grid items-center gap-8 lg:grid-cols-2">
          <PlaceFrame src={SCENE.passu} alt="Passu, Upper Hunza" className="h-64" />
          <div>
        <h2 className="display text-4xl text-pine">Why Agencies Join TTN</h2>
        <p className="mt-4 max-w-2xl text-ink/70">
          List departures, collect bookings from Pakistan’s big cities, and see seats, revenue and
          settlements in one portal. TTN keeps a configurable platform commission — currently{" "}
          {(rates.commissionBps / 100).toFixed(rates.commissionBps % 100 === 0 ? 0 : 1)}% — snapshotted
          per booking.
        </p>
        <Link href="/agency/signup" className="btn-pine mt-6 inline-flex rounded-full px-5 py-2.5">
          Become an Agency
        </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16">
        <h2 className="display text-4xl">Frequently Asked Questions</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {[
            ["Do I pay the full fare now?", "If you book early enough, you pay a deposit to hold seats. The rest is due before departure."],
            ["Can two people take the same seat?", "No. Seats are claimed in a database transaction. A hold expires if payment is not completed."],
            ["Who receives my transfer?", "You choose: instant pay (card on Stripe, or JazzCash when the merchant is live), or a transfer to the agency’s listed bank / EasyPaisa / JazzCash with a screenshot. TTN only collects if a recovery payment is in effect."],
            ["Do I need a screenshot?", "Yes for a transfer. Instant card and JazzCash checkout are confirmed by the provider — no screenshot."],
          ].map(([q, a]) => (
            <div key={q} className="card rounded-3xl p-5">
              <p className="font-semibold">{q}</p>
              <p className="mt-2 text-sm text-ink/70">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </PageShell>
  );
}

function HomeTripRail({
  title,
  trips,
  locale,
  depositBps,
}: {
  title: string;
  trips: Parameters<typeof TripCard>[0]["trip"][];
  locale: "en" | "ur";
  depositBps: number;
}) {
  if (!trips.length) return null;
  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between gap-3">
        <h2 className="display text-4xl">{title}</h2>
        <Link href="/trips" className="text-link text-sm">
          See all
        </Link>
      </div>
      <div className="mt-6 grid gap-5">
        {trips.map((trip) => (
          <TripCard key={trip.id} trip={trip} locale={locale} depositBps={depositBps} />
        ))}
      </div>
    </section>
  );
}
