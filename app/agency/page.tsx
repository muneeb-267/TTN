import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { formatDate, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { AgencyFeePayForm } from "@/components/fee-forms";
import { PlaceHero } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";
import {
  commissionLabel,
  enforceAgencyFeeStatus,
  getFinanceRates,
  platformPayoutAccounts,
} from "@/lib/platform-fees";
import { stripeConfigured } from "@/lib/payments";
import { syncAgencyConnect } from "@/lib/connect";
import { ConnectDashboardButton, ConnectOnboardingButton } from "@/components/connect-forms";
import { formatBps } from "@/lib/money";

export default async function AgencyHome({
  searchParams,
}: {
  searchParams: Promise<{ connect?: string }>;
}) {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const locale = await getLocale();
  const copy = t(locale);
  const query = await searchParams;
  const agency = await prisma.agency.findUnique({
    where: { userId: session.id },
    include: {
      refunds: { where: { status: "PENDING" } },
      reviews: true,
    },
  });
  if (!agency) redirect("/agency/signup");
  if (agency.stripeAccountId || query.connect) {
    await syncAgencyConnect(agency.id);
  }
  const liveAgency = await prisma.agency.findUnique({ where: { id: agency.id } });
  const connectReady = Boolean(liveAgency?.stripePayoutsReady);
  const cardLive = stripeConfigured();
  const rates = await getFinanceRates();
  const ledger = await enforceAgencyFeeStatus(agency.id);
  const platformAccounts = await platformPayoutAccounts();
  const feeName = await commissionLabel();
  const now = new Date();
  const [feeHistory, trips, bookingStats, travelerGroups, paidMoney] = await Promise.all([
    prisma.platformFeePayment.findMany({
      where: { agencyId: agency.id },
      orderBy: { createdAt: "desc" },
      take: 8,
    }),
    prisma.trip.findMany({
      where: { agencyId: agency.id },
      select: { id: true, published: true, returnAt: true },
    }),
    prisma.booking.aggregate({
      where: {
        trip: { agencyId: agency.id },
        status: { notIn: ["EXPIRED"] },
      },
      _count: { _all: true },
    }),
    prisma.booking.groupBy({
      by: ["travelerId"],
      where: {
        trip: { agencyId: agency.id },
        status: { notIn: ["EXPIRED"] },
      },
    }),
    prisma.booking.aggregate({
      where: {
        trip: { agencyId: agency.id },
        status: { in: ["DEPOSIT_PAID", "FULLY_PAID", "COMPLETED"] },
      },
      _sum: { totalPrice: true, platformFee: true, agencySettlement: true },
    }),
  ]);
  const tripCount = trips.length;
  const completedTrips = trips.filter((trip) => trip.returnAt <= now).length;
  const rating =
    agency.reviews.length > 0
      ? agency.reviews.reduce((sum, review) => sum + review.rating, 0) / agency.reviews.length
      : 0;
  const pending = agency.status === "PENDING";

  return (
    <PageShell locale={locale} user={session}>
      <PlaceHero
        image={SCENE.passu}
        kicker="Agency portal"
        title={agency.businessName}
        subtitle={
          ledger.status === "DELISTED"
            ? "Not listed — pay the outstanding fee to go live again."
            : pending
              ? copy.pendingAgency
              : `Verified · ${feeName} on successful bookings`
        }
        compact
      />
      <div className="mx-auto max-w-6xl px-4 py-10">
        {pending ? (
          <div className="card mb-8 rounded-3xl p-6">
            <p className="text-xs font-semibold tracking-[0.22em] text-moss">BECOME A TTN AGENCY</p>
            <ol className="agency-steps mt-4">
              <li className="is-active">
                <span>1</span>Basic information
              </li>
              <li className="is-active">
                <span>2</span>Verification
              </li>
              <li className="is-active">
                <span>3</span>Experience
              </li>
              <li className="is-active">
                <span>4</span>Review
              </li>
              <li>
                <span>✓</span>Approved
              </li>
            </ol>
            <p className="mt-4 text-sm text-ink/70">
              Application received. Typical review time: 1–2 working days. You cannot publish trips until a
              TTN admin approves you.
            </p>
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-2">
          <Hub
            kicker="Trips"
            title={`${tripCount} posted`}
            body="Destination, dates, price, seats, vehicle, hotels, meals, itinerary, pickup and photos."
            href="/agency/trips"
            cta={agency.status === "APPROVED" ? "Post or edit trips" : "View trips"}
          />
          <Hub
            kicker="Bookings"
            title={`${bookingStats._count._all} bookings · ${travelerGroups.length} travelers`}
            body="Open a trip folder for traveler names, seats, deposit vs remaining, and payment status."
            href="/agency/bookings"
            cta="Open bookings"
          />
          <Hub
            kicker="Finance"
            title={`${pkr(ledger.outstanding)} fee due`}
            body={`Gross confirmed: ${pkr(paidMoney._sum.totalPrice || 0)} · ${feeName}: ${pkr(paidMoney._sum.platformFee || 0)} · Your settlement: ${pkr(paidMoney._sum.agencySettlement || 0)}. ${connectReady ? "Card payments auto-split." : "Connect Stripe to auto-split cards."}`}
            href="#payouts"
            cta={connectReady ? "Payouts & fees" : "Set up card payouts"}
          />
          <Hub
            kicker="Reputation"
            title={agency.reviews.length ? `${rating.toFixed(1)} / 5 · ${agency.reviews.length} reviews` : "No reviews yet"}
            body={`${completedTrips} completed trips. Reviews unlock after a traveler finishes a paid booking.`}
            href="/agency/gallery"
            cta="Public agency page"
          />
        </div>

        <div id="payouts" className="card mt-10 rounded-3xl p-6">
          <p className="text-xs tracking-widest text-moss">CARD PAYOUTS</p>
          <h2 className="display mt-2 text-3xl">
            {connectReady ? "Auto-split is on" : cardLive ? "Connect a payout account" : "Card auto-split is not live yet"}
          </h2>
          <p className="mt-2 text-sm text-ink/70">
            {connectReady
              ? `Card payments keep ${formatBps(rates.commissionBps)} plus a card processing rate for TTN, then transfer the rest here. JazzCash, EasyPaisa and bank stay at ${formatBps(rates.commissionBps)} only — those wallets cannot auto-split.`
              : cardLive
                ? `Finish Stripe onboarding so card checkout can keep ${formatBps(rates.commissionBps)} plus card processing for TTN and send the rest here. Wallet and bank collections stay at ${formatBps(rates.commissionBps)} with a screenshot.`
                : "TTN still needs a Stripe key on the server. Until then, travelers pay listed wallets or bank and upload a screenshot."}
          </p>
          {query.connect === "return" ? (
            <p className="mt-3 text-sm text-moss">
              {connectReady
                ? "Payouts are ready. The next card payment will auto-split."
                : "Stripe saved your details. If payouts still show pending, finish any remaining requirements."}
            </p>
          ) : null}
          {agency.status === "APPROVED" && cardLive ? (
            <div className="mt-5 flex flex-wrap gap-3">
              <ConnectOnboardingButton ready={connectReady} />
              {liveAgency?.stripeAccountId ? <ConnectDashboardButton /> : null}
            </div>
          ) : null}
        </div>

        <div id="finance" className="card mt-10 rounded-3xl p-6">
          <p className="text-xs tracking-widest text-moss">PLATFORM FEE ({feeName})</p>
          <h2 className="display mt-2 text-3xl">{pkr(ledger.outstanding)} due</h2>
          <p className="mt-2 text-sm text-ink/70">
            {ledger.upcoming > 0 ? `${pkr(ledger.upcoming)} more after trips return. ` : ""}
            {ledger.dueAt
              ? `Pay within 2 days of the trip ending (by ${formatDate(ledger.dueAt, locale)}).`
              : "Fees are due 2 days after each trip returns. Send them to the TTN account below."}
          </p>
          {ledger.lines.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[32rem] text-left text-sm">
                <thead>
                  <tr className="text-xs tracking-widest text-moss">
                    <th className="pb-2 font-semibold">Trip</th>
                    <th className="pb-2 font-semibold">Seats booked</th>
                    <th className="pb-2 font-semibold">Fare</th>
                    <th className="pb-2 font-semibold">{feeName} fee</th>
                  </tr>
                </thead>
                <tbody>
                  {ledger.lines.map((line) => (
                    <tr key={line.tripId} className="border-t border-gold/25">
                      <td className="py-2 pr-3">
                        <span className="font-medium">{line.title}</span>
                        <span className="mt-0.5 block text-xs text-ink/55">
                          {line.fromCity} → {line.toDestination}
                          {line.due ? "" : " · after return"}
                        </span>
                      </td>
                      <td className="py-2 pr-3">{line.seats}</td>
                      <td className="py-2 pr-3">{pkr(line.fare)}</td>
                      <td className="py-2 font-semibold">{pkr(line.fee)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-4 text-sm text-ink/60">
              No paid seats yet. {feeName} is counted once travelers’ deposits are confirmed.
            </p>
          )}
          <div className="mt-6">
            <AgencyFeePayForm amountDue={Math.max(ledger.outstanding, 0)} accounts={platformAccounts} />
          </div>
          {feeHistory.length ? (
            <ul className="mt-6 space-y-1 text-sm text-ink/65">
              {feeHistory.map((p) => (
                <li key={p.id}>
                  {p.status.toLowerCase()} · {pkr(p.amount)} · {p.method}
                  {p.providerTxn ? ` · ${p.providerTxn}` : ""}
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          {agency.status === "APPROVED" ? (
            <Link href="/agency/trips/new" className="btn-gold rounded-full px-5 py-2.5 font-semibold">
              {copy.postTrip}
            </Link>
          ) : null}
          <Link href="/agency/gallery" className="nav-link border border-gold/40">
            {copy.agencyProfile}
          </Link>
          <Link href="/agency/refunds" className="nav-link border border-gold/40">
            Refunds {agency.refunds.length ? `(${agency.refunds.length})` : ""}
          </Link>
        </div>
      </div>
    </PageShell>
  );
}

function Hub({
  kicker,
  title,
  body,
  href,
  cta,
}: {
  kicker: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}) {
  return (
    <Link href={href} className="card card-hover block rounded-3xl p-6">
      <p className="text-xs font-semibold tracking-[0.22em] text-moss">{kicker}</p>
      <h2 className="display mt-2 text-3xl">{title}</h2>
      <p className="mt-2 text-sm text-ink/70">{body}</p>
      <span className="mt-4 inline-flex text-sm font-semibold text-pine">{cta} →</span>
    </Link>
  );
}
