"use client";

import { useActionState } from "react";
import { startCardCheckout, submitPaymentProof } from "@/app/actions/payments";
import { Field, inputClass } from "@/components/fields";
import { pkr } from "@/lib/format";

export function WalletProofForm({
  paymentId,
  method,
}: {
  paymentId: string;
  method: string;
}) {
  const [state, action, pending] = useActionState(
    async (_: { error?: string; ok?: boolean } | null, formData: FormData) => {
      return submitPaymentProof(paymentId, formData);
    },
    null,
  );
  const bank = method === "bank";
  return (
    <form action={action} encType="multipart/form-data" className="space-y-3">
      {bank ? (
        <Field label="Account you sent from (IBAN or number)">
          <input name="payerAccount" required className={inputClass} placeholder="PK00… or 03…" />
        </Field>
      ) : (
        <>
          <Field label="Your JazzCash / EasyPaisa number">
            <input name="payerAccount" required className={inputClass} placeholder="03xxxxxxxxx" />
          </Field>
          <Field label="Transaction ID (TID)">
            <input name="providerTxn" required className={inputClass} placeholder="From the app receipt" />
          </Field>
        </>
      )}
      {bank ? (
        <Field label="Transfer reference / RR number">
          <input name="providerTxn" required className={inputClass} placeholder="Bank receipt number" />
        </Field>
      ) : null}
      <Field label="Screenshot of the receipt">
        <input name="receipt" type="file" accept="image/*" required className={inputClass} />
      </Field>
      <p className="text-xs text-ink/55">A clear screenshot is required so the payment can be matched.</p>
      {state?.error ? <p className="text-sm text-red-800">{state.error}</p> : null}
      {state?.ok ? (
        <p className="text-sm text-moss">Submitted. TTN will match this payment and lock the seats.</p>
      ) : null}
      <button disabled={pending} className="btn-gold w-full rounded-full px-5 py-3 font-semibold">
        {pending ? "Sending…" : "I have paid — submit proof"}
      </button>
    </form>
  );
}

export function CardPayButton({ paymentId, amount }: { paymentId: string; amount: number }) {
  const [error, action, pending] = useActionState(
    async (_: string | null) => {
      const result = await startCardCheckout(paymentId);
      return result?.error || null;
    },
    null,
  );
  return (
    <form action={action} className="space-y-3">
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-gold w-full rounded-full px-5 py-3 font-semibold">
        {pending ? "Opening Stripe…" : `Pay ${pkr(amount)} by card`}
      </button>
    </form>
  );
}

export function JazzCashAutoPost({
  action,
  fields,
}: {
  action: string;
  fields: Record<string, string>;
}) {
  return (
    <form action={action} method="POST" className="space-y-3">
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button className="btn-gold w-full rounded-full px-5 py-3 font-semibold" type="submit">
        Continue to JazzCash
      </button>
      <p className="text-center text-xs text-ink/55">You will confirm the payment in the JazzCash app or portal.</p>
    </form>
  );
}
