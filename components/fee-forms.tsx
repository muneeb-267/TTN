"use client";

import { useActionState, useState } from "react";
import { savePlatformAccounts, submitPlatformFeeProof } from "@/app/actions/fees";
import { Field, inputClass } from "@/components/fields";
import { pkr } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";

export function AdminAccountsForm({
  defaults,
}: {
  defaults: {
    bankName: string;
    bankTitle: string;
    bankIban: string;
    bankAccount: string;
    jazzcashName: string;
    jazzcashNumber: string;
    easypaisaName: string;
    easypaisaNumber: string;
  };
}) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await savePlatformAccounts(formData);
      return result?.error || (result?.ok ? "saved" : null);
    },
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <p className="text-sm text-ink/65">
        Agencies send the 5% platform fee here. If they miss the 2-day window after a trip,
        traveler checkout uses these details until the fee is covered.
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Bank name">
          <input name="bankName" required className={inputClass} defaultValue={defaults.bankName} />
        </Field>
        <Field label="Bank account title">
          <input name="bankTitle" required className={inputClass} defaultValue={defaults.bankTitle} />
        </Field>
        <Field label="IBAN">
          <input name="bankIban" required className={inputClass} defaultValue={defaults.bankIban} placeholder="PK00…" />
        </Field>
        <Field label="Account number (optional)">
          <input name="bankAccount" className={inputClass} defaultValue={defaults.bankAccount} />
        </Field>
        <Field label="EasyPaisa name (optional)">
          <input name="easypaisaName" className={inputClass} defaultValue={defaults.easypaisaName} />
        </Field>
        <Field label="EasyPaisa number (optional)">
          <input name="easypaisaNumber" className={inputClass} defaultValue={defaults.easypaisaNumber} />
        </Field>
        <Field label="JazzCash name (optional)">
          <input name="jazzcashName" className={inputClass} defaultValue={defaults.jazzcashName} />
        </Field>
        <Field label="JazzCash number (optional)">
          <input name="jazzcashNumber" className={inputClass} defaultValue={defaults.jazzcashNumber} />
        </Field>
      </div>
      {error && error !== "saved" ? <p className="text-sm text-red-800">{error}</p> : null}
      {error === "saved" ? <p className="text-sm text-moss">Saved.</p> : null}
      <button disabled={pending} className="btn-gold rounded-full px-5 py-2.5 font-semibold">
        {pending ? "Saving…" : "Save collection accounts"}
      </button>
    </form>
  );
}

export function AgencyFeePayForm({
  amountDue,
  accounts,
}: {
  amountDue: number;
  accounts: {
    bank: { name: string; title: string; iban: string; account: string };
    easypaisa: { name: string; number: string };
    jazzcash: { name: string; number: string };
  };
}) {
  const methods = PAYMENT_METHODS.filter((m) => {
    if (m.id === "card") return false;
    if (m.id === "easypaisa") return Boolean(accounts.easypaisa.number);
    if (m.id === "jazzcash") return Boolean(accounts.jazzcash.number);
    return true;
  });
  const [method, setMethod] = useState<string>(methods.find((m) => m.id === "bank")?.id || "bank");
  const [state, action, pending] = useActionState(
    async (_: { error?: string; ok?: boolean } | null, formData: FormData) => {
      return submitPlatformFeeProof(formData);
    },
    null,
  );
  const bank = method === "bank";
  return (
    <div className="space-y-5">
      <dl className="space-y-2 text-sm">
        {bank ? (
          <>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">Bank</dt>
              <dd className="text-right font-medium">{accounts.bank.name || "—"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">Account title</dt>
              <dd className="text-right font-medium">{accounts.bank.title || "TTN Travel To North"}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">IBAN</dt>
              <dd className="text-right font-medium">{accounts.bank.iban || "Not listed yet"}</dd>
            </div>
            {accounts.bank.account ? (
              <div className="flex justify-between gap-4">
                <dt className="text-ink/55">Account no.</dt>
                <dd className="text-right font-medium">{accounts.bank.account}</dd>
              </div>
            ) : null}
          </>
        ) : method === "easypaisa" ? (
          <>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">EasyPaisa name</dt>
              <dd className="text-right font-medium">{accounts.easypaisa.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">Number</dt>
              <dd className="text-right font-medium">{accounts.easypaisa.number}</dd>
            </div>
          </>
        ) : (
          <>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">JazzCash name</dt>
              <dd className="text-right font-medium">{accounts.jazzcash.name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-ink/55">Number</dt>
              <dd className="text-right font-medium">{accounts.jazzcash.number}</dd>
            </div>
          </>
        )}
        <div className="flex justify-between gap-4">
          <dt className="text-ink/55">Amount due</dt>
          <dd className="text-right font-semibold">{pkr(amountDue)}</dd>
        </div>
      </dl>
      <form action={action} className="space-y-3">
        <input type="hidden" name="method" value={method} />
        <input type="hidden" name="amount" value={amountDue} />
        <div className="grid gap-2 sm:grid-cols-3">
          {methods.map((m) => (
            <button
              type="button"
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={`rounded-2xl border px-3 py-2 text-sm transition hover:border-gold ${
                method === m.id ? "border-gold bg-gold/20" : "border-ink/10 bg-white hover:bg-sand/60"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>
        {bank ? (
          <>
            <Field label="Account you sent from">
              <input name="payerAccount" required className={inputClass} placeholder="PK00… or 03…" />
            </Field>
            <Field label="Transfer reference / RR number">
              <input name="providerTxn" required className={inputClass} placeholder="Bank receipt number" />
            </Field>
          </>
        ) : (
          <>
            <Field label="Your wallet number">
              <input name="payerAccount" required className={inputClass} placeholder="03xxxxxxxxx" />
            </Field>
            <Field label="Transaction ID (TID)">
              <input name="providerTxn" required className={inputClass} placeholder="From the app receipt" />
            </Field>
          </>
        )}
        <Field label="Screenshot of the receipt">
          <input name="receipt" type="file" accept="image/*" className={inputClass} />
        </Field>
        {state?.error ? <p className="text-sm text-red-800">{state.error}</p> : null}
        {state?.ok ? (
          <p className="text-sm text-moss">Submitted. TTN will match this transfer.</p>
        ) : null}
        <button disabled={pending || amountDue <= 0} className="btn-gold w-full rounded-full px-5 py-3 font-semibold">
          {pending ? "Sending…" : `I paid ${pkr(amountDue)}`}
        </button>
      </form>
    </div>
  );
}
