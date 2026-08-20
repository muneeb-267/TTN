"use client";

import { useActionState, useState } from "react";
import { bookSeats, payRemaining, requestRefund } from "@/app/actions/bookings";
import { PAYMENT_METHODS } from "@/lib/constants";
import { Field, inputClass } from "@/components/fields";
import { pkr } from "@/lib/format";

type MethodOption = { id: string; label: string; blurb?: string };

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
  instantMethods = [],
  manualMethods = PAYMENT_METHODS.filter((m) => m.id !== "card"),
  agencyName = "the agency",
  diverted = false,
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
  instantMethods?: MethodOption[];
  manualMethods?: MethodOption[];
  agencyName?: string;
  diverted?: boolean;
}) {
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
      <PayPathFields
        instantMethods={instantMethods}
        manualMethods={manualMethods}
        agencyName={agencyName}
        diverted={diverted}
      />
      <p className="text-xs text-ink/55">
        Seats are held for {holdMinutes} minutes. Instant pay is confirmed by the provider. A transfer stays pending
        until the screenshot is matched — never from this screen alone.
      </p>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-gold w-full rounded-full px-5 py-3 font-semibold">
        {pending ? "Holding seats…" : `Continue to pay ${pkr(depositAmount)}`}
      </button>
    </form>
  );
}

function PayPathFields({
  instantMethods,
  manualMethods,
  agencyName,
  diverted,
}: {
  instantMethods: MethodOption[];
  manualMethods: MethodOption[];
  agencyName: string;
  diverted: boolean;
}) {
  const defaultPath = instantMethods.length ? "INSTANT" : "MANUAL";
  const [path, setPath] = useState<"INSTANT" | "MANUAL">(defaultPath);
  const active = path === "INSTANT" ? instantMethods : manualMethods;
  const [method, setMethod] = useState(active[0]?.id || "bank");
  const listed = path === "INSTANT" ? instantMethods : manualMethods;
  const selected = listed.some((m) => m.id === method) ? method : listed[0]?.id || "bank";

  function choosePath(next: "INSTANT" | "MANUAL") {
    setPath(next);
    const nextList = next === "INSTANT" ? instantMethods : manualMethods;
    if (!nextList.some((m) => m.id === method)) setMethod(nextList[0]?.id || "bank");
  }

  return (
    <div className="space-y-4">
      <input type="hidden" name="collection" value={path} />
      <input type="hidden" name="method" value={selected} />
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => choosePath("INSTANT")}
          disabled={!instantMethods.length}
          className={`pay-tile w-full px-4 py-4 ${path === "INSTANT" ? "is-on" : ""} ${
            instantMethods.length ? "" : "cursor-not-allowed opacity-55"
          }`}
        >
          <span className="text-[10px] font-semibold tracking-[0.2em] text-moss">INSTANT</span>
          <span className="mt-1 block text-base font-semibold">Pay now</span>
          <span className="mt-1 block text-xs text-ink/60">
            {instantMethods.length
              ? "Card or JazzCash — confirmed automatically, like buying Spotify Premium."
              : "Instant card / JazzCash goes live once merchant keys are on the server."}
          </span>
        </button>
        <button
          type="button"
          onClick={() => choosePath("MANUAL")}
          className={`pay-tile w-full px-4 py-4 ${path === "MANUAL" ? "is-on" : ""}`}
        >
          <span className="text-[10px] font-semibold tracking-[0.2em] text-moss">TRANSFER</span>
          <span className="mt-1 block text-base font-semibold">Pay the listed account</span>
          <span className="mt-1 block text-xs text-ink/60">
            {diverted
              ? "Send to TTN’s recovery account, then upload a screenshot."
              : `Send to ${agencyName}’s bank, EasyPaisa or JazzCash, then upload a screenshot.`}
          </span>
        </button>
      </div>
      {listed.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {listed.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`pay-tile px-3 py-3 text-sm ${selected === m.id ? "is-on" : ""}`}
            >
              <span className="block font-semibold">{m.label}</span>
              {m.blurb ? <span className="mt-1 block text-xs text-ink/60">{m.blurb}</span> : null}
            </button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-ink/60">No payment methods are listed for this path yet.</p>
      )}
    </div>
  );
}

export function RemainingPayForm({
  bookingId,
  amount,
  instantMethods = [],
  manualMethods = PAYMENT_METHODS.filter((m) => m.id !== "card"),
  agencyName = "the agency",
  diverted = false,
}: {
  bookingId: string;
  amount: number;
  instantMethods?: MethodOption[];
  manualMethods?: MethodOption[];
  agencyName?: string;
  diverted?: boolean;
}) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await payRemaining(bookingId, formData);
      return result?.error || null;
    },
    null,
  );
  return (
    <form action={action} className="space-y-3">
      <PayPathFields
        instantMethods={instantMethods}
        manualMethods={manualMethods}
        agencyName={agencyName}
        diverted={diverted}
      />
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
            className={`pay-tile px-3 py-2 text-sm ${payoutMethod === m.id ? "is-on" : ""}`}
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
