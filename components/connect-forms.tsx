"use client";

import { useActionState } from "react";
import { openAgencyStripeDashboard, startAgencyConnect } from "@/app/actions/connect";

export function ConnectOnboardingButton({ ready }: { ready: boolean }) {
  const [error, action, pending] = useActionState(
    async (_: string | null) => {
      const result = await startAgencyConnect();
      return result?.error || null;
    },
    null,
  );
  return (
    <form action={action} className="space-y-2">
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-gold rounded-full px-5 py-2.5 font-semibold">
        {pending ? "Opening Stripe…" : ready ? "Update payout details" : "Connect payouts on Stripe"}
      </button>
    </form>
  );
}

export function ConnectDashboardButton() {
  const [error, action, pending] = useActionState(
    async (_: string | null) => {
      const result = await openAgencyStripeDashboard();
      return result?.error || null;
    },
    null,
  );
  return (
    <form action={action} className="space-y-2">
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="nav-link border border-gold/40">
        {pending ? "Opening…" : "Open Express dashboard"}
      </button>
    </form>
  );
}
