import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="LEGAL"
      title="Privacy Policy"
      intro="Placeholder privacy notice pending professional review. TTN stores account, booking and payment-matching data needed to operate the marketplace."
      sections={[
        {
          heading: "What we store",
          points: [
            "Name, email, phone and booking records.",
            "Payment proofs and transaction IDs used to match transfers. We do not store card PAN data; card checkout is hosted by the card processor.",
            "Agency verification documents are visible to TTN admins, not to the public.",
          ],
        },
      ]}
    />
  );
}
