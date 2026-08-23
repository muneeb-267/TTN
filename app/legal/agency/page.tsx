import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="LEGAL"
      title="Agency Terms"
      intro="You sell trips as an independent operator. TTN is not your employer, and listing on TTN does not make TTN a co-organiser of the tour."
      sections={[
        {
          heading: "Verification and listings",
          points: [
            "Signup needs WhatsApp review screenshots, two CNIC photos, at least five client phone numbers, and original trip photos. Admin approves before you can take bookings.",
            "Photos and videos must be real, not AI-generated or stolen from another operator.",
            "Keep your JazzCash, EasyPaisa, and bank details current. Travelers pay those accounts unless a platform fee recovery is in effect.",
          ],
        },
        {
          heading: "Commission and fees",
          points: [
            "A platform commission (default 2.5%, stored in basis points) is snapshotted on each successful booking and is not rewritten when the rate later changes.",
            "Card payments can take that commission automatically and transfer the rest to your connected Stripe payout account once onboarding is complete. Wallet and bank transfers still need matching; those methods do not auto-split.",
            "After a trip returns, any commission not already taken on a card split is due to TTN’s listed bank or wallets. If you miss it, traveler checkout can be diverted to TTN until the fee is covered, and listings can be taken down.",
            "TTN is merchant of record on destination card charges. Disputes on those charges are handled by the platform. Card processing fees are billed to TTN and may be added to the application fee when a processing rate is configured.",
          ],
        },
        {
          heading: "Conduct",
          points: [
            "Honour confirmed seats, published hotels, and the refund split shown to the traveler.",
            "TTN may delist an agency for unpaid fees, fake media, or unresolved disputes.",
          ],
        },
      ]}
    />
  );
}
