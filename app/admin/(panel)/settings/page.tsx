import { getFinanceRates, getPlatformSettings } from "@/lib/platform-fees";
import { AdminAccountsForm } from "@/components/fee-forms";
import { saveCommissionSettings } from "@/app/actions/admin";
import { paymentEnvironment } from "@/lib/payment-providers";
import { isPakIban, isPlaceholderIban, launchEnvStatus, realAccountText } from "@/lib/env";
import { DEFAULT_CARD_PROCESSING_BPS } from "@/lib/money";

function Check({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <li className="flex gap-3 text-sm">
      <span className={ok ? "font-semibold text-moss" : "font-semibold text-red-800"}>{ok ? "Ready" : "Needed"}</span>
      <span>
        <span className="font-medium text-ink">{label}.</span> {detail}
      </span>
    </li>
  );
}

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();
  const rates = await getFinanceRates();
  const pay = paymentEnvironment();
  const env = launchEnvStatus();
  const bankReady = isPakIban(settings.bankIban) && !isPlaceholderIban(settings.bankIban);
  const walletsReady = Boolean(realAccountText(settings.jazzcashNumber) || realAccountText(settings.easypaisaNumber));
  return (
    <div className="space-y-10">
      <div>
        <h1 className="display text-4xl">Platform settings</h1>
        <p className="mt-2 text-sm text-ink/60">
          Currency {settings.currency} · {settings.timezone}. Commission changes never rewrite past bookings.
        </p>
      </div>
      <div className="card rounded-3xl p-6">
        <h2 className="display text-3xl">Go-live checklist</h2>
        <p className="mt-2 text-sm text-ink/60">
          Transfer + screenshot can launch without Stripe or JazzCash merchant keys. Instant card/JazzCash
          stay hidden until those keys exist on the server.
        </p>
        <ul className="mt-4 space-y-2">
          <Check
            ok={env.authSecret}
            label="AUTH_SECRET"
            detail="Random string, 32+ characters, in the host environment — not in git."
          />
          <Check
            ok={env.appUrlHttps}
            label="APP_URL"
            detail="Public https origin (your real domain). Needed for Stripe/JazzCash return URLs and secure cookies."
          />
          <Check ok={env.paymentsMockOff} label="Payments" detail="Mock mode must stay off on the live server." />
          <Check
            ok={bankReady}
            label="TTN bank IBAN"
            detail="Paste the live Pakistani IBAN below. Placeholder zeros are blocked."
          />
          <Check
            ok={walletsReady}
            label="JazzCash or EasyPaisa wallet"
            detail="At least one wallet number so agencies can pay the 2.5% fee without a bank transfer."
          />
          <Check
            ok={env.stripeKey}
            label="Card checkout + auto-split (optional)"
            detail={
              env.stripeKey
                ? env.stripeWebhook
                  ? "Stripe key and webhook secret are set. Agencies can connect a payout account so card charges keep TTN’s commission and transfer the rest."
                  : "Stripe key is set. Add STRIPE_WEBHOOK_SECRET so paid sessions and Connect account updates confirm without relying on the browser return."
                : "Leave empty to hide card pay. Prefer a restricted key (rk_) plus webhook /api/payments/stripe/webhook. Enable Connect in the Stripe Dashboard (platform profile, negative balance liability: your platform)."
            }
          />
          <Check
            ok={env.jazzcashMerchant}
            label="JazzCash hosted checkout (optional)"
            detail={
              env.jazzcashMerchant
                ? env.jazzcashProduction
                  ? "Merchant keys are set with JAZZCASH_ENV=production."
                  : "Merchant keys are set, but JAZZCASH_ENV is not production — travelers would still hit sandbox."
                : "Wallet P2P + screenshot still works without merchant keys."
            }
          />
        </ul>
      </div>
      <div className="card rounded-3xl p-6">
        <h2 className="display text-3xl">Collection accounts</h2>
        <div className="mt-4">
          <AdminAccountsForm
            defaults={{
              bankName: settings.bankName,
              bankTitle: settings.bankTitle,
              bankIban: isPlaceholderIban(settings.bankIban) ? "" : settings.bankIban,
              bankAccount: settings.bankAccount,
              jazzcashName: settings.jazzcashName,
              jazzcashNumber: realAccountText(settings.jazzcashNumber),
              easypaisaName: settings.easypaisaName,
              easypaisaNumber: realAccountText(settings.easypaisaNumber),
            }}
          />
        </div>
      </div>
      <form action={saveCommissionSettings} className="card max-w-lg space-y-3 rounded-3xl p-6">
        <h2 className="display text-3xl">Commercial defaults</h2>
        <label className="block text-sm">
          Commission bps
          <input name="commissionBps" type="number" defaultValue={rates.commissionBps} className="mt-1 w-full rounded-full border px-4 py-2" />
        </label>
        <label className="block text-sm">
          Processing fee bps
          <input name="processingFeeBps" type="number" defaultValue={rates.processingFeeBps || DEFAULT_CARD_PROCESSING_BPS} className="mt-1 w-full rounded-full border px-4 py-2" />
        </label>
        <p className="text-xs text-ink/55">
          Cards only. 0 falls back to a 3% estimate so the 2.5% commission is not eaten by Stripe
          fees. JazzCash, EasyPaisa and bank never use this rate. Match{" "}
          <a className="text-link" href="https://stripe.com/pricing" target="_blank" rel="noreferrer">
            stripe.com/pricing
          </a>{" "}
          for your region, or use the{" "}
          <a
            className="text-link"
            href="https://dashboard.stripe.com/settings/connect/platform_pricing"
            target="_blank"
            rel="noreferrer"
          >
            Platform Pricing Tool
          </a>
          . Do not also set application_fee_amount if you switch that tool on.
        </p>
        <label className="block text-sm">
          Deposit bps
          <input name="depositBps" type="number" defaultValue={rates.depositBps} className="mt-1 w-full rounded-full border px-4 py-2" />
        </label>
        <label className="block text-sm">
          Seat hold minutes
          <input name="seatHoldMinutes" type="number" defaultValue={rates.seatHoldMinutes} className="mt-1 w-full rounded-full border px-4 py-2" />
        </label>
        <button className="btn-gold rounded-full px-5 py-2.5 font-semibold">Save</button>
      </form>
      <div className="card rounded-3xl p-6 text-sm text-ink/70">
        <h2 className="display text-3xl text-ink">Payment providers</h2>
        <p className="mt-3">{pay.note}</p>
        <ul className="mt-3 list-disc pl-5">
          <li>JazzCash hosted gateway: {pay.jazzcashGateway ? "keys present" : "not configured"}</li>
          <li>EasyPaisa gateway: {pay.easypaisaGateway ? "keys present" : "not configured (wallet P2P still works)"}</li>
          <li>Card (Stripe): {pay.cardGateway ? "keys present" : "not configured"}</li>
          <li>Mock mode: {pay.mock ? "ON — DEVELOPMENT ONLY" : "off"}</li>
        </ul>
      </div>
    </div>
  );
}

