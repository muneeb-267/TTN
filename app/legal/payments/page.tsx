import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="LEGAL"
      title="Payment Terms"
      intro="Placeholder payment terms. JazzCash and EasyPaisa production checkout is not claimed ready until merchant approval, credentials, callbacks and settlement terms exist."
      sections={[
        {
          heading: "How money moves today",
          points: [
            "Wallet and bank transfers to the listed agency account stay pending until matched.",
            "Card payments, when enabled, are confirmed only by the processor webhook or paid Checkout session — never by the browser alone.",
            "TTN commission is an accounting amount snapshotted on the booking. It is invoiced to the agency after the trip unless a recovery collection is in effect.",
          ],
        },
      ]}
    />
  );
}
