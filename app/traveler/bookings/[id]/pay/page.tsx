import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { CardPayButton, JazzCashAutoPost, TransferCheckout } from "@/components/payment-forms";
import {
  appBaseUrl,
  jazzcashConfigured,
  jazzcashHostedRequest,
  randomTxnRef,
  releaseExpiredHolds,
  stripeConfigured,
} from "@/lib/payments";
import { travelerPayOptions } from "@/lib/platform-fees";
import { finalizeStripeReturn } from "@/app/actions/payments";
import { PAYMENT_HOLD_MINUTES } from "@/lib/constants";

export default async function PayBookingPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ stripe?: string; session_id?: string; cancelled?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") redirect("/traveler/login");
  await releaseExpiredHolds();
  const locale = await getLocale();
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { trip: { include: { agency: true } }, seats: true, payments: { orderBy: { createdAt: "desc" } } },
  });
  if (!booking || booking.travelerId !== session.id) notFound();

  const pending = booking.payments.find((p) => p.status === "PENDING");
  if (query.session_id && pending) {
    await finalizeStripeReturn(pending.id, query.session_id);
    redirect(`/traveler/bookings/${booking.id}/slip`);
  }
  if (!pending) {
    if (["DEPOSIT_PAID", "FULLY_PAID", "COMPLETED"].includes(booking.status)) {
      redirect(`/traveler/bookings/${booking.id}/slip`);
    }
    return (
      <PageShell locale={locale} user={session}>
        <div className="mx-auto max-w-lg px-4 py-16">
          <h1 className="display text-4xl">Payment closed</h1>
          <p className="mt-3 text-ink/70">This hold expired or was cancelled. Pick seats again.</p>
          <Link href={`/trips/${booking.tripId}`} className="btn-pine mt-6 inline-flex rounded-full px-5 py-2.5">
            Back to trip
          </Link>
        </div>
      </PageShell>
    );
  }

  const pay = await travelerPayOptions(booking.trip, booking.trip.agency);
  const accounts = pay.accounts;
  if (pay.diverted && pending.collectedByPlatform === false) {
    await prisma.payment.update({
      where: { id: pending.id },
      data: { collectedByPlatform: true },
    });
  }
  const method = pending.method;
  const instant = pending.collection === "INSTANT" || method === "card";
  const jazzcashLive = instant && method === "jazzcash" && jazzcashConfigured();
  const jazzcashForm = jazzcashLive
    ? jazzcashHostedRequest({
        amountPkr: pending.amount,
        txnRef: pending.providerRef || randomTxnRef(),
        billRef: booking.publicRef,
        description: `TTN ${booking.publicRef} ${booking.trip.title}`,
        returnUrl: `${await appBaseUrl()}/api/payments/jazzcash/return`,
      })
    : null;

  if (jazzcashForm && !pending.providerRef) {
    await prisma.payment.update({
      where: { id: pending.id },
      data: { providerRef: jazzcashForm.fields.pp_TxnRefNo, collectedByPlatform: true },
    });
  }

  const payee = pay.diverted ? "TTN Travel To North" : booking.trip.agency.businessName;
  const kindLabel =
    pending.kind === "REMAINING" ? "remaining 50%" : pending.kind === "FULL" ? "full fare" : "50% deposit";

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-xs tracking-widest text-moss">PAY {booking.publicRef}</p>
        <h1 className="display mt-2 text-4xl">Send {pkr(pending.amount)}</h1>
        <p className="mt-2 text-ink/70">
          {booking.trip.title} · seats {booking.seats.map((s) => s.code).join(", ")} · {kindLabel}
        </p>
        <p className="mt-1 text-sm text-ink/55">
          Held until {booking.holdUntil ? formatDateTime(booking.holdUntil, locale) : `${PAYMENT_HOLD_MINUTES} minutes`}
        </p>
        <p className="mt-3 inline-flex rounded-full bg-sand px-3 py-1 text-[11px] font-semibold tracking-wide text-moss">
          {instant ? "Instant checkout" : `Transfer to ${payee}`}
        </p>
        {query.cancelled ? (
          <p className="mt-4 text-sm text-red-800">Card checkout was cancelled. You can try again.</p>
        ) : null}

        <div className="card mt-6 space-y-4 rounded-3xl p-6">
          {instant && method === "card" ? (
            <>
              <h2 className="display text-2xl">Visa / Mastercard</h2>
              <p className="text-sm text-ink/70">
                You’ll finish on Stripe’s secure page. TTN never sees your card number.
                {pending.autoSplit
                  ? " This card payment keeps TTN’s commission plus card processing and transfers the rest to the agency. Your fare does not increase."
                  : " Card processing is taken from the agency share, not added to this amount."}
              </p>
              {stripeConfigured() ? (
                <CardPayButton paymentId={pending.id} amount={pending.amount} />
              ) : (
                <p className="text-sm text-ink/70">
                  Card checkout is not live on this server yet. Go back and choose a transfer instead.
                </p>
              )}
            </>
          ) : null}

          {instant && method === "jazzcash" ? (
            <>
              <h2 className="display text-2xl">JazzCash</h2>
              {jazzcashForm ? (
                <>
                  <p className="text-sm text-ink/70">Confirm the payment in JazzCash. No screenshot is needed.</p>
                  <JazzCashAutoPost action={jazzcashForm.action} fields={jazzcashForm.fields} />
                </>
              ) : (
                <p className="text-sm text-ink/70">
                  JazzCash instant checkout is not live on this server yet. Go back and choose a transfer instead.
                </p>
              )}
            </>
          ) : null}

          {!instant && method === "jazzcash" ? (
            <>
              <h2 className="display text-2xl">JazzCash</h2>
              <TransferCheckout
                method="jazzcash"
                payee={payee}
                accountName={accounts.jazzcash.name}
                account={accounts.jazzcash.number}
                amount={pending.amount}
                refCode={booking.publicRef}
                paymentId={pending.id}
              />
            </>
          ) : null}

          {!instant && method === "easypaisa" ? (
            <>
              <h2 className="display text-2xl">EasyPaisa</h2>
              <TransferCheckout
                method="easypaisa"
                payee={payee}
                accountName={accounts.easypaisa.name}
                account={accounts.easypaisa.number}
                amount={pending.amount}
                refCode={booking.publicRef}
                paymentId={pending.id}
              />
            </>
          ) : null}

          {!instant && method === "bank" ? (
            <>
              <h2 className="display text-2xl">Bank / Raast</h2>
              <TransferCheckout
                method="bank"
                payee={payee}
                accountName={accounts.bank.title || payee}
                account={accounts.bank.iban}
                extraLines={[
                  { label: "Bank", value: accounts.bank.name || "Bank not listed" },
                  { label: "Account title", value: accounts.bank.title || payee },
                  { label: "IBAN", value: accounts.bank.iban, copy: true },
                  ...(accounts.bank.account
                    ? [{ label: "Account no.", value: accounts.bank.account, copy: true }]
                    : []),
                ]}
                amount={pending.amount}
                refCode={booking.publicRef}
                paymentId={pending.id}
              />
            </>
          ) : null}

          {instant && method !== "card" && method !== "jazzcash" ? (
            <p className="text-sm text-ink/70">This instant method is not available. Choose a transfer instead.</p>
          ) : null}
        </div>
        <Link href={`/traveler/bookings/${booking.id}`} className="mt-6 inline-block text-sm text-link">
          Booking details
        </Link>
      </div>
    </PageShell>
  );
}

