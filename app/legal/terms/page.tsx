import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="LEGAL"
      title="Terms & Conditions"
      intro="Placeholder wording for professional legal review. This is not legal advice and does not claim regulatory compliance."
      sections={[
        {
          heading: "Using TTN",
          points: [
            "TTN (Travel To North) is a marketplace that lists group tours offered by independent travel agencies.",
            "A booking is a contract between the traveler and the agency, subject to these platform terms.",
            "TTN may suspend accounts that misuse the marketplace.",
          ],
        },
      ]}
    />
  );
}
