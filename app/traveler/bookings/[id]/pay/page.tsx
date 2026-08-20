import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { CardPayButton, JazzCashAutoPost, WalletProofForm } from "@/components/payment-forms";
import { CopyValue } from "@/components/copy-value";
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
              <PayTo
                label={pay.diverted ? "Send JazzCash to this account" : `Send to ${booking.trip.agency.businessName} JazzCash`}
                name={accounts.jazzcash.name}
                number={accounts.jazzcash.number}
                amount={pending.amount}
                refCode={booking.publicRef}
              />
              <WalletProofForm paymentId={pending.id} method="jazzcash" />
            </>
          ) : null}

          {!instant && method === "easypaisa" ? (
            <>
              <h2 className="display text-2xl">EasyPaisa</h2>
              <PayTo
                label={pay.diverted ? "Send EasyPaisa to this account" : `Send to ${booking.trip.agency.businessName} EasyPaisa`}
                name={accounts.easypaisa.name}
                number={accounts.easypaisa.number}
                amount={pending.amount}
                refCode={booking.publicRef}
              />
              <WalletProofForm paymentId={pending.id} method="easypaisa" />
            </>
          ) : null}

          {!instant && method === "bank" ? (
            <>
              <h2 className="display text-2xl">Bank / Raast</h2>
              <dl className="space-y-3 text-sm">
                <Row label="Bank" value={accounts.bank.name || "Bank not listed"} />
                <Row
                  label="Account title"
                  value={accounts.bank.title || (pay.diverted ? "TTN Travel To North" : booking.trip.agency.businessName)}
                />
                <CopyRow label="IBAN" value={accounts.bank.iban} empty="IBAN not listed" />
                {accounts.bank.account ? <CopyRow label="Account no." value={accounts.bank.account} /> : null}
                <Row label="Amount" value={pkr(pending.amount)} />
                <CopyRow label="Narration / ref" value={booking.publicRef} />
              </dl>
              <p className="text-xs text-ink/55">
                Send the exact amount. Put {booking.publicRef} in the transfer details so the payment can be matched,
                then upload a screenshot.
              </p>
              <WalletProofForm paymentId={pending.id} method="bank" />
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

function PayTo({
  label,
  name,
  number,
  amount,
  refCode,
}: {
  label: string;
  name: string;
  number: string;
  amount: number;
  refCode: string;
}) {
  return (
    <div className="space-y-2 text-sm">
      <p className="font-medium">{label}</p>
      <p>{name || "Account title not listed"}</p>
      <p className="display text-2xl tracking-wide">
        <CopyValue value={number} empty="Account not listed yet" />
      </p>
      <p>
        Send exactly <strong>{pkr(amount)}</strong>
      </p>
      <p className="flex flex-wrap items-center gap-2">
        Message / reference: <CopyValue value={refCode} />
      </p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/55">{label}</dt>
      <dd className="text-right font-medium">{value}</dd>
    </div>
  );
}

function CopyRow({ label, value, empty }: { label: string; value: string; empty?: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-ink/55">{label}</dt>
      <dd className="text-right">
        <CopyValue value={value} empty={empty} />
      </dd>
    </div>
  );
}
