"use client";

import { useActionState, useState } from "react";
import { bookSeats, payRemaining, requestRefund } from "@/app/actions/bookings";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Field, inputClass } from "@/components/fields";
import { pkr } from "@/lib/format";

export function CheckoutForm({
  tripId,
  seats,
  depositAmount,
  remainingAmount,
  totalPrice,
  remainingDue,
  fullPay,
}: {
  tripId: string;
  seats: string[];
  depositAmount: number;
  remainingAmount: number;
  totalPrice: number;
  remainingDue: string;
  fullPay: boolean;
}) {
  const [method, setMethod] = useState("jazzcash");
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await bookSeats(formData);
      return result?.error || null;
    },
    null,
  );

  return (
    <form action={action} className="card space-y-5 rounded-3xl p-6">
      <input type="hidden" name="tripId" value={tripId} />
      <input type="hidden" name="seats" value={seats.join(",")} />
      <input type="hidden" name="method" value={method} />
      <h2 className="display text-2xl">Pay to confirm</h2>
      <ul className="space-y-2 text-sm">
        <li className="flex justify-between">
          <span>Seats</span>
          <span>{seats.join(", ")}</span>
        </li>
        <li className="flex justify-between">
          <span>Total</span>
          <span>{pkr(totalPrice)}</span>
        </li>
        <li className="flex justify-between font-semibold">
          <span>{fullPay ? "Pay now" : "50% due now"}</span>
          <span>{pkr(depositAmount)}</span>
        </li>
        {!fullPay ? (
          <li className="flex justify-between text-ink/70">
            <span>Remaining (due {remainingDue})</span>
            <span>{pkr(remainingAmount)}</span>
          </li>
        ) : null}
        <li className="flex justify-between text-ink/60">
          <span>TTN fee (5%, from fare)</span>
          <span>included in settlement</span>
        </li>
      </ul>
      <div className="grid gap-2 sm:grid-cols-2">
        {PAYMENT_METHODS.map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => setMethod(m.id)}
            className={`rounded-2xl border px-3 py-3 text-left text-sm transition hover:border-gold ${
              method === m.id ? "border-gold bg-gold/20" : "border-ink/10 bg-white hover:bg-sand/60"
            }`}
          >
            <span className="block font-semibold">{m.label}</span>
            <span className="mt-1 block text-xs text-ink/60">{m.blurb}</span>
          </button>
        ))}
      </div>
      <p className="text-xs text-ink/55">
        Seats are held for 45 minutes. JazzCash, EasyPaisa and bank stay pending until TTN matches
        the transfer. Cards confirm automatically through Stripe. Refunds are only allowed before
        the remaining 50% is paid.
      </p>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-gold w-full rounded-full px-5 py-3 font-semibold">
        {pending ? "Holding seats…" : `Continue to pay ${pkr(depositAmount)}`}
      </button>
    </form>
  );
}

export function RemainingPayForm({ bookingId, amount }: { bookingId: string; amount: number }) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await payRemaining(bookingId, formData);
      return result?.error || null;
    },
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <select name="method" className={inputClass}>
        {PAYMENT_METHODS.map((m) => (
          <option key={m.id} value={m.id}>
            {m.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-pine rounded-full px-5 py-2.5">
        {pending ? "Paying…" : `Pay remaining ${pkr(amount)}`}
      </button>
    </form>
  );
}

export function RefundForm({ bookingId }: { bookingId: string }) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await requestRefund(bookingId, formData);
      return result?.error || null;
    },
    null,
  );
  const [payoutMethod, setPayoutMethod] = useState("jazzcash");
  return (
    <form action={action} className="space-y-3">
      <Field label="Why are you backing off?">
        <textarea name="reason" required rows={3} className={inputClass} />
      </Field>
      <p className="text-sm font-medium text-ink/80">Where should the agency send the refund?</p>
      <input type="hidden" name="payoutMethod" value={payoutMethod} />
      <div className="grid gap-2 sm:grid-cols-3">
        {PAYMENT_METHODS.filter((m) => m.id !== "card").map((m) => (
          <button
            type="button"
            key={m.id}
            onClick={() => setPayoutMethod(m.id)}
            className={`rounded-2xl border px-3 py-2 text-sm transition hover:border-gold ${
              payoutMethod === m.id ? "border-gold bg-gold/20" : "border-ink/10 bg-white hover:bg-sand/60"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <Field label="Account title / name">
        <input name="payoutAccountName" required className={inputClass} placeholder="Name on the account" />
      </Field>
      <Field label={payoutMethod === "bank" ? "Account number / IBAN" : "Wallet number"}>
        <input
          name="payoutAccountNo"
          required
          className={inputClass}
          placeholder={payoutMethod === "bank" ? "PK00…" : "03xxxxxxxxx"}
        />
      </Field>
      {payoutMethod === "bank" ? (
        <Field label="Bank name">
          <input name="payoutBank" required className={inputClass} placeholder="HBL, Meezan, UBL…" />
        </Field>
      ) : null}
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="rounded-full border border-ink/20 px-5 py-2.5 transition hover:border-gold hover:bg-sand">
        {pending ? "Sending…" : "Request refund"}
      </button>
    </form>
  );
}
