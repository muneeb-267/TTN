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
            "TTN commission is an accounting amount snapshotted on the booking. It is invoiced to the agency after the trip unless a recovery collection is in effect.",
            "Card keys belong only in the server environment. Prefer a Stripe restricted key and a signed webhook at /api/payments/stripe/webhook.",
          ],
        },
      ]}
    />
  );
}
