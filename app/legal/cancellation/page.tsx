import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="POLICY"
      title="Cancellation Policy"
      intro="Default platform rules. An agency may publish stricter rules on a trip. Confirm the amount shown before you cancel."
      sections={[
        {
          heading: "Default windows",
          points: [
            "Within 24 hours of booking, before remaining payment: full deposit refund if the agency honours it. Refusal can trigger a platform fine.",
            "After 24 hours, before remaining payment: the deposit is split (traveler 20%, agency 15%, TTN 15% of that half-payment) unless a trip lists different terms.",
            "After remaining payment, cancellations follow the trip’s published policy and admin review.",
          ],
        },
      ]}
    />
  );
}
