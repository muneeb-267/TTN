import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { CardPayButton, JazzCashAutoPost, WalletProofForm } from "@/components/payment-forms";
import {
  appBaseUrl,
  jazzcashConfigured,
  jazzcashHostedRequest,
  agencyPayoutAccounts,
  payoutAccounts,
  randomTxnRef,
  releaseExpiredHolds,
  stripeConfigured,
} from "@/lib/payments";
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

  const listed = agencyPayoutAccounts(booking.trip, booking.trip.agency);
  const accounts = payoutAccounts(booking.trip, booking.trip.agency);
  const method = pending.method;
  const jazzcashLive = method === "jazzcash" && jazzcashConfigured() && !listed.jazzcash.number;
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
      data: { providerRef: jazzcashForm.fields.pp_TxnRefNo },
    });
  }

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-lg px-4 py-10">
        <p className="text-xs tracking-widest text-moss">PAY {booking.publicRef}</p>
        <h1 className="display mt-2 text-4xl">Send {pkr(pending.amount)}</h1>
        <p className="mt-2 text-ink/70">
          {booking.trip.title} · seats {booking.seats.map((s) => s.code).join(", ")} ·{" "}
          {pending.kind === "REMAINING" ? "remaining 50%" : pending.kind === "FULL" ? "full fare" : "50% deposit"}
        </p>
        <p className="mt-1 text-sm text-ink/55">
          Held until {booking.holdUntil ? formatDateTime(booking.holdUntil, locale) : `${PAYMENT_HOLD_MINUTES} minutes`}
        </p>
        {query.cancelled ? (
          <p className="mt-4 text-sm text-red-800">Card checkout was cancelled. You can try again.</p>
        ) : null}

        <div className="card mt-6 space-y-4 rounded-3xl p-6">
          {method === "jazzcash" ? (
            <>
              <h2 className="display text-2xl">JazzCash</h2>
              {jazzcashForm ? (
                <JazzCashAutoPost action={jazzcashForm.action} fields={jazzcashForm.fields} />
              ) : (
                <>
                  <PayTo
                    label={`Send to ${booking.trip.agency.businessName} JazzCash`}
                    name={accounts.jazzcash.name}
                    number={accounts.jazzcash.number}
                    amount={pending.amount}
                    refCode={booking.publicRef}
                  />
                  <WalletProofForm paymentId={pending.id} method="jazzcash" />
                </>
              )}
            </>
          ) : null}

          {method === "easypaisa" ? (
            <>
              <h2 className="display text-2xl">EasyPaisa</h2>
              <PayTo
                label={`Send to ${booking.trip.agency.businessName} EasyPaisa`}
                name={accounts.easypaisa.name}
                number={accounts.easypaisa.number}
                amount={pending.amount}
                refCode={booking.publicRef}
              />
              <WalletProofForm paymentId={pending.id} method="easypaisa" />
            </>
          ) : null}

          {method === "bank" ? (
            <>
              <p className="text-[10px] font-semibold tracking-[0.2em] text-moss">MAIN OPTION</p>
              <h2 className="display text-2xl">Bank / Raast</h2>
              <dl className="space-y-2 text-sm">
                <Row label="Bank" value={accounts.bank.name || "Bank not listed"} />
                <Row label="Account title" value={accounts.bank.title || booking.trip.agency.businessName} />
                <Row label="IBAN" value={accounts.bank.iban || "IBAN not listed"} />
                {accounts.bank.account ? <Row label="Account no." value={accounts.bank.account} /> : null}
                <Row label="Amount" value={pkr(pending.amount)} />
                <Row label="Narration / ref" value={booking.publicRef} />
              </dl>
              <p className="text-xs text-ink/55">
        Send the exact amount. Put {booking.publicRef} in the transfer details so the agency can match it.
              </p>
              <WalletProofForm paymentId={pending.id} method="bank" />
            </>
          ) : null}

          {method === "card" ? (
            <>
              <h2 className="display text-2xl">Visa / Mastercard</h2>
              {stripeConfigured() ? (
                <CardPayButton paymentId={pending.id} amount={pending.amount} />
              ) : (
                <p className="text-sm text-ink/70">
                  Card checkout goes live once Stripe keys are on the server. Use bank transfer, or
                  EasyPaisa / JazzCash if the agency listed them.
                </p>
              )}
            </>
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
      <p>
        {name}
        <br />
        <span className="display text-2xl tracking-wide">{number || "Account not listed yet"}</span>
      </p>
      <p>
        Send exactly <strong>{pkr(amount)}</strong>
      </p>
      <p>
        Message / reference: <strong>{refCode}</strong>
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
