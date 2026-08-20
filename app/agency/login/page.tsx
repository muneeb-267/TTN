import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { LoginForm } from "@/components/auth-forms";
import { PlaceFrame } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";
import { applyBps, formatBps } from "@/lib/money";
import { pkr } from "@/lib/format";
import { getFinanceRates } from "@/lib/platform-fees";

const EXAMPLE_FARE = 30_000;

const PERKS = [
  "Reach travelers looking for Hunza, Skardu, Naran and Swat",
  "Create trips with dates, vehicle, hotels and a cinema seat map",
  "Receive bookings and see who paid the deposit",
  "Track the 2.5% TTN fee and settlements",
  "Build a public agency page with photos and reviews",
];

export default async function AgencyLoginPage() {
  const locale = await getLocale();
  const user = await getSession();
  const rates = await getFinanceRates();
  const feeName = formatBps(rates.commissionBps);
  const exampleFee = applyBps(EXAMPLE_FARE, rates.commissionBps);
  return (
    <PageShell locale={locale} user={user}>
      <section className="signin-stage">
        <div className="relative mx-auto grid max-w-6xl items-start gap-8 px-4 py-12 md:grid-cols-2 md:py-16">
          <div>
            <PlaceFrame src={SCENE.passu} alt="Passu Cathedral, Upper Hunza" className="h-52 md:h-[22rem]" />
            <p className="signin-kicker mt-6">Agency portal</p>
            <h1 className="display mt-3 text-4xl text-sand sm:text-5xl">Grow your travel business with TTN</h1>
            <p className="mt-4 max-w-xl text-lg text-sand/95">
              Reach travelers looking for trips to Pakistan’s northern areas.
            </p>
            <p className="mt-2 text-sm font-semibold tracking-wide text-gold-2">Real trips. Real seats. Real dates.</p>
            <ul className="mt-6 space-y-2 text-sm text-sand/90">
              {PERKS.map((perk) => (
                <li key={perk} className="flex gap-2">
                  <span className="text-gold-2">✓</span>
                  <span>{perk}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 rounded-3xl border-2 border-gold/40 bg-pine/40 p-5 text-sand">
              <p className="text-xs font-semibold tracking-[0.22em] text-gold-2">SIMPLE PRICING</p>
              <p className="display mt-2 text-3xl">No monthly subscription</p>
              <p className="mt-2 text-sm text-sand/90">
                Only {feeName} TTN commission on successful bookings.
              </p>
              <p className="mt-4 text-sm text-sand/80">
                Trip booking: {pkr(EXAMPLE_FARE)}
                <br />
                TTN commission: {pkr(exampleFee)}
                <br />
                You keep the rest.*
              </p>
              <p className="mt-3 text-xs text-sand/60">
                *Payment processing and applicable charges are shown separately. The rate is locked on each booking.
              </p>
            </div>
          </div>
          <div className="signin-panel">
            <p className="text-xs font-semibold tracking-[0.22em] text-moss">WELCOME BACK</p>
            <h2 className="display mt-2 text-3xl text-pine">Agency login</h2>
            <p className="mt-2 text-sm text-ink/65">Sign in to post trips, manage seats, and see bookings.</p>
            <div className="mt-6">
              <LoginForm role="AGENCY" />
            </div>
            <div className="mt-8 border-t border-gold/30 pt-6">
              <p className="text-sm text-ink/70">Don’t have an agency account?</p>
              <Link href="/agency/signup" className="btn-gold mt-3 inline-flex w-full justify-center rounded-full px-5 py-3 font-semibold">
                Become a TTN Agency
              </Link>
            </div>
            <p className="mt-5 text-center text-sm text-ink/55">
              Traveler?{" "}
              <Link href="/traveler/login" className="text-link underline">
                Sign in to book a seat
              </Link>
            </p>
          </div>
        </div>
      </section>
    </PageShell>
  );
}
