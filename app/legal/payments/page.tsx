import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="LEGAL"
      title="Payment Terms"
      intro="Travelers can pay instantly (card or JazzCash hosted checkout) or transfer to the listed bank / EasyPaisa / JazzCash account and upload a screenshot. Instant checkout is confirmed only by the processor. Transfers stay pending until matched."
      sections={[
        {
          heading: "How money moves today",
          points: [
            "Choose instant pay (card / JazzCash hosted, when keys are live) or a transfer to the listed agency account with a required screenshot.",
            "Wallet and bank transfers stay pending until matched. Instant checkout is confirmed only by the processor webhook, paid Checkout session, or JazzCash callback — never by the browser alone.",
            "When an agency has a connected Stripe payout account, card checkout is a destination charge: TTN is merchant of record, the snapshotted commission plus a card processing rate are taken as the application fee, and the rest transfers to that agency. The traveler fare does not increase. JazzCash, EasyPaisa and bank stay at the commission only and cannot auto-split.",
            "If the agency has not finished payout onboarding, or a fee recovery is in effect, the card charge stays on TTN and is settled later from the ledger.",
            "Card keys belong only in the server environment. Prefer a Stripe restricted key and a signed webhook at /api/payments/stripe/webhook. Connect events (account updates) use the same webhook.",
          ],
        },
      ]}
    />
  );
}
