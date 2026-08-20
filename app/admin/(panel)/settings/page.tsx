import { getFinanceRates, getPlatformSettings } from "@/lib/platform-fees";
import { AdminAccountsForm } from "@/components/fee-forms";
import { saveCommissionSettings } from "@/app/actions/admin";
import { paymentEnvironment } from "@/lib/payment-providers";

export default async function AdminSettingsPage() {
  const settings = await getPlatformSettings();
  const rates = await getFinanceRates();
  const pay = paymentEnvironment();
  return (
    <div className="space-y-10">
      <div>
        <h1 className="display text-4xl">Platform settings</h1>
        <p className="mt-2 text-sm text-ink/60">
          Currency {settings.currency} · {settings.timezone}. Commission changes never rewrite past bookings.
        </p>
      </div>
      <div className="card rounded-3xl p-6">
        <h2 className="display text-3xl">Collection accounts</h2>
        <div className="mt-4">
          <AdminAccountsForm
            defaults={{
              bankName: settings.bankName,
              bankTitle: settings.bankTitle,
              bankIban: settings.bankIban,
              bankAccount: settings.bankAccount,
              jazzcashName: settings.jazzcashName,
              jazzcashNumber: settings.jazzcashNumber,
              easypaisaName: settings.easypaisaName,
              easypaisaNumber: settings.easypaisaNumber,
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
          <input name="processingFeeBps" type="number" defaultValue={rates.processingFeeBps} className="mt-1 w-full rounded-full border px-4 py-2" />
        </label>
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
