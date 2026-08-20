import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="POLICY"
      title="Dispute Policy"
      intro="Travelers and agencies can report problems from a booking or trip. TTN reviews the file from the admin console. This is a marketplace process, not a court or regulator."
      sections={[
        {
          heading: "How to open a case",
          points: [
            "Sign in and use Contact support, or the report link on the booking or trip page.",
            "Say what happened, and attach payment screenshots, hotel pictures, or chat evidence if you have them.",
            "Email the same evidence to the support address in the footer so nothing is missed.",
          ],
        },
        {
          heading: "What TTN can do",
          points: [
            "Ask both sides for more evidence.",
            "Confirm, reverse, or hold a payment match; record a refund split; hold a settlement; suspend or delist an account.",
            "TTN cannot force a bank to reverse an IBFT. Outcomes depend on who still holds the money and what evidence exists.",
          ],
        },
      ]}
    />
  );
}
