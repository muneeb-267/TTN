import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="LEGAL"
      title="Traveler Terms"
      intro="Placeholder traveler terms. You are booking a seat on an agency-operated group tour."
      sections={[
        {
          heading: "Your responsibilities",
          points: [
            "Pay the deposit within the seat hold window and the remaining amount by the due date.",
            "Provide accurate traveler information.",
            "Reviews are only allowed after a completed paid booking.",
          ],
        },
      ]}
    />
  );
}
