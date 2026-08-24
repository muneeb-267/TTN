import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="POLICY"
      title="Refund Policy"
      intro="Refund amounts are calculated from money already paid and shown before you confirm. Payouts follow the account details you provide."
      sections={[
        {
          heading: "How refunds move",
          points: [
            "TTN records the refund in a ledger. The party holding the funds (usually the agency, unless TTN collected a recovery payment) sends the transfer.",
            "Payment-provider refunds for hosted checkouts require the provider’s refund API and merchant approval — not assumed live.",
            "Disputed refunds can be opened from the booking page.",
          ],
        },
      ]}
    />
  );
}
