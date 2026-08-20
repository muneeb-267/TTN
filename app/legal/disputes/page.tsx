import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="POLICY"
      title="Dispute Policy"
      intro="Placeholder dispute policy. Travelers can report agency, trip, payment, misrepresentation or cancellation issues. TTN investigates from the admin console."
      sections={[
        {
          heading: "Process",
          points: [
            "Open a report from the booking or trip page.",
            "Admin may request evidence from both sides.",
            "Outcomes can include refunds, holds on settlements, or account suspension.",
          ],
        },
      ]}
    />
  );
}
