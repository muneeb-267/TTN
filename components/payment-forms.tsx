"use client";

import { useActionState, useEffect, useRef } from "react";
import { startCardCheckout, submitPaymentProof } from "@/app/actions/payments";
import { Field, inputClass } from "@/components/fields";
import { CopyValue } from "@/components/copy-value";
import { pkr } from "@/lib/format";
import { pkrCopyAmount, transferCheckoutSteps, walletAppHref } from "@/lib/wallet-checkout";

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
      <p className="text-xs text-ink/55">
        A clear screenshot is required so the payment can be matched. Submitting this form does not mark the
        booking paid by itself.
      </p>
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

export function TransferCheckout({
  method,
  payee,
  accountName,
  account,
  extraLines,
  amount,
  refCode,
  paymentId,
}: {
  method: "jazzcash" | "easypaisa" | "bank";
  payee: string;
  accountName: string;
  account: string;
  extraLines?: { label: string; value: string; copy?: boolean }[];
  amount: number;
  refCode: string;
  paymentId: string;
}) {
  const steps = transferCheckoutSteps({ method, payee, account, amount, refCode });
  const wallet = method === "jazzcash" || method === "easypaisa";
  return (
    <div className="space-y-5">
      <div className="rounded-2xl border border-gold/35 bg-[#fff8ea] p-4">
        <p className="text-[10px] font-semibold tracking-[0.2em] text-moss">PAY TO</p>
        <p className="mt-1 font-medium">{accountName || payee || "Account title not listed"}</p>
        {method === "bank" ? (
          <dl className="mt-3 space-y-2 text-sm">
            {extraLines?.map((line) => (
              <div key={line.label} className="flex justify-between gap-4">
                <dt className="text-ink/55">{line.label}</dt>
                <dd className="text-right">
                  {line.copy ? <CopyValue value={line.value} /> : <span className="font-medium">{line.value}</span>}
                </dd>
              </div>
            ))}
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">Amount</dt>
              <dd className="text-right">
                <CopyValue value={pkr(amount)} copyText={pkrCopyAmount(amount)} />
              </dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">Narration / ref</dt>
              <dd className="text-right">
                <CopyValue value={refCode} />
              </dd>
            </div>
          </dl>
        ) : (
          <>
            <p className="display mt-2 text-2xl tracking-wide">
              <CopyValue value={account} empty="Account not listed yet" />
            </p>
            <p className="mt-2 text-sm">
              Send exactly <CopyValue value={pkr(amount)} copyText={pkrCopyAmount(amount)} />
            </p>
            <p className="mt-1 flex flex-wrap items-center gap-2 text-sm">
              Message / reference: <CopyValue value={refCode} />
            </p>
          </>
        )}
      </div>
      {wallet ? (
        <a
          href={walletAppHref(method)}
          target="_blank"
          rel="noreferrer"
          className="btn-pine inline-flex w-full justify-center rounded-full px-5 py-3 font-semibold"
        >
          Open {method === "jazzcash" ? "JazzCash" : "EasyPaisa"}
        </a>
      ) : null}
      <ol className="wallet-steps">
        {steps.map((step) => (
          <li key={step.n}>
            <span>{step.n}</span>
            <div>
              <p className="font-semibold">{step.title}</p>
              <p className="text-xs text-ink/60">{step.detail}</p>
              {step.copy ? (
                <p className="mt-1">
                  <CopyValue value={step.copy} />
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
      <WalletProofForm paymentId={paymentId} method={method} />
    </div>
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
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    formRef.current?.submit();
  }, []);
  return (
    <form ref={formRef} action={action} method="POST" className="space-y-3">
      {Object.entries(fields).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value} />
      ))}
      <button className="btn-gold w-full rounded-full px-5 py-3 font-semibold" type="submit">
        Continue to JazzCash
      </button>
      <p className="text-center text-xs text-ink/55">
        Redirecting to JazzCash hosted checkout. Confirm in the JazzCash app or portal — no screenshot needed.
      </p>
    </form>
  );
}
