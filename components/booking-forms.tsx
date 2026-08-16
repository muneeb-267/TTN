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
            className={`rounded-2xl border px-3 py-3 text-sm transition hover:border-gold ${
              method === m.id ? "border-gold bg-gold/20" : "border-ink/10 bg-white hover:bg-sand/60"
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>
      <p className="text-xs text-ink/55">
        Demo checkout: payment is recorded on TTN. Connect JazzCash / EasyPaisa merchant keys when
        you go live. Same-day cancel: request a full refund from the agency. After one day: of the
        30% of the half payment, 15% stays with TTN and 15% with the agency; you receive 20% of the
        half back.
      </p>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-gold w-full rounded-full px-5 py-3 font-semibold">
        {pending ? "Confirming…" : `Pay ${pkr(depositAmount)} and lock seats`}
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
  return (
    <form action={action} className="space-y-3">
      <Field label="Why are you backing off?">
        <textarea name="reason" required rows={3} className={inputClass} />
      </Field>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="rounded-full border border-ink/20 px-5 py-2.5 transition hover:border-gold hover:bg-sand">
        {pending ? "Sending…" : "Request refund"}
      </button>
    </form>
  );
}
