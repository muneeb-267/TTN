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
  platformFee = 0,
  processingFee = 0,
  commissionLabel = "2.5%",
  holdMinutes = 10,
  methods = PAYMENT_METHODS,
}: {
  tripId: string;
  seats: string[];
  depositAmount: number;
  remainingAmount: number;
  totalPrice: number;
  remainingDue: string;
  fullPay: boolean;
  platformFee?: number;
  processingFee?: number;
  commissionLabel?: string;
  holdMinutes?: number;
  methods?: typeof PAYMENT_METHODS | { id: string; label: string; blurb?: string }[];
}) {
  const [method, setMethod] = useState(methods.find((m) => m.id === "bank")?.id || methods[0]?.id || "bank");
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
          <span>Subtotal</span>
          <span>{pkr(totalPrice)}</span>
        </li>
        <li className="flex justify-between text-ink/60">
          <span>TTN commission ({commissionLabel})</span>
          <span>{pkr(platformFee)} included</span>
        </li>
        {processingFee ? (
          <li className="flex justify-between text-ink/60">
            <span>Payment processing fee</span>
            <span>{pkr(processingFee)}</span>
          </li>
        ) : (
          <li className="flex justify-between text-ink/60">
            <span>Payment processing fee</span>
            <span>Not added until a provider rate is configured</span>
          </li>
        )}
        <li className="flex justify-between font-semibold">
          <span>{fullPay ? "Pay now" : "Due today"}</span>
          <span>{pkr(depositAmount)}</span>
        </li>
        {!fullPay ? (
          <li className="flex justify-between text-ink/70">
            <span>Remaining (due {remainingDue})</span>
            <span>{pkr(remainingAmount)}</span>
          </li>
        ) : null}
      </ul>
      <PayMethodPicker methods={methods} method={method} onChange={setMethod} />
      <p className="text-xs text-ink/55">
        Seats are held for {holdMinutes} minutes. Bank transfer is the main option. EasyPaisa and JazzCash
        show only if listed. Payment is confirmed server-side after matching or a provider callback — never
        from this screen alone.
      </p>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-gold w-full rounded-full px-5 py-3 font-semibold">
        {pending ? "Holding seats…" : `Continue to pay ${pkr(depositAmount)}`}
      </button>
    </form>
  );
}

function PayMethodPicker({
  methods,
  method,
  onChange,
}: {
  methods: readonly { id: string; label: string; blurb?: string }[];
  method: string;
  onChange: (id: string) => void;
}) {
  const bank = methods.find((m) => m.id === "bank");
  const secondary = methods.filter((m) => m.id !== "bank");
  return (
    <div className="space-y-2">
      {bank ? (
        <button
          type="button"
          onClick={() => onChange(bank.id)}
          className={`w-full rounded-2xl border px-4 py-4 text-left transition hover:border-gold ${
            method === bank.id ? "border-gold bg-gold/20" : "border-ink/10 bg-white hover:bg-sand/60"
          }`}
        >
          <span className="text-[10px] font-semibold tracking-[0.2em] text-moss">MAIN OPTION</span>
          <span className="mt-1 block text-base font-semibold">{bank.label}</span>
          <span className="mt-1 block text-xs text-ink/60">
            {bank.blurb || "IBFT or Raast to the listed bank account."}
          </span>
        </button>
      ) : null}
      {secondary.length ? (
        <>
          <p className="pt-2 text-[10px] font-semibold tracking-[0.2em] text-moss">ALSO AVAILABLE</p>
          <div className="grid gap-2 sm:grid-cols-2">
            {secondary.map((m) => (
              <button
                type="button"
                key={m.id}
                onClick={() => onChange(m.id)}
                className={`rounded-2xl border px-3 py-3 text-left text-sm transition hover:border-gold ${
                  method === m.id ? "border-gold bg-gold/20" : "border-ink/10 bg-white hover:bg-sand/60"
                }`}
              >
                <span className="block font-semibold">{m.label}</span>
                {m.blurb ? <span className="mt-1 block text-xs text-ink/60">{m.blurb}</span> : null}
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}

export function RemainingPayForm({
  bookingId,
  amount,
  methods = PAYMENT_METHODS,
}: {
  bookingId: string;
  amount: number;
  methods?: typeof PAYMENT_METHODS | { id: string; label: string; blurb?: string }[];
}) {
  const [method, setMethod] = useState(methods.find((m) => m.id === "bank")?.id || methods[0]?.id || "bank");
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await payRemaining(bookingId, formData);
      return result?.error || null;
    },
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="method" value={method} />
      <PayMethodPicker methods={methods} method={method} onChange={setMethod} />
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
  const [payoutMethod, setPayoutMethod] = useState("bank");
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
