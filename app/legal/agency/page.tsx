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
            "After a trip returns, you have a short window to pay the accrued fee to TTN’s listed bank or wallets. If you miss it, traveler checkout can be diverted to TTN until the fee is covered, and listings can be taken down.",
            "Do not assume TTN can legally hold traveler funds and pay you out on a normal merchant account. Instant card/JazzCash collections, when enabled, follow the merchant arrangement actually approved for this business.",
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
