import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="LEGAL"
      title="Agency Terms"
      intro="Placeholder agency terms. You sell trips as an independent operator. TTN is not your employer."
      sections={[
        {
          heading: "Marketplace",
          points: [
            "You must pass verification before listing.",
            "A configurable platform commission is snapshotted on each successful booking.",
            "Settlements depend on the approved payment-provider arrangement. Do not assume TTN can legally hold and redistribute third-party funds on a normal merchant account.",
          ],
        },
      ]}
    />
  );
}
