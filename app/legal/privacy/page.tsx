import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="LEGAL"
      title="Privacy Policy"
      intro="This notice explains what TTN stores to run the marketplace. It is operational copy, not a certified privacy policy. Have counsel review it before you treat it as a public legal filing."
      sections={[
        {
          heading: "Account and booking data",
          points: [
            "We store your name, email, phone (if given), password hash, role, and the bookings, comments, and reviews you create.",
            "Agencies also upload CNIC photos, WhatsApp review screenshots, client phone numbers, trip photos, and bank or wallet details used for payouts.",
            "Verification documents are visible to TTN admins, not to the public profile.",
          ],
        },
        {
          heading: "Payments",
          points: [
            "For bank / JazzCash / EasyPaisa transfers we store the booking reference, amount, method, transaction ID or sending account, and the screenshot you upload so staff can match the transfer.",
            "Card checkout is hosted by Stripe. TTN does not store card PAN or CVC. Stripe sends a payment confirmation to our webhook.",
            "We do not sell your personal data. Support email and dispute files are used to resolve the case you opened.",
          ],
        },
        {
          heading: "Cookies and session",
          points: [
            "A signed httpOnly cookie keeps you signed in for up to 14 days.",
            "A language cookie remembers English or Urdu.",
            "You can ask support to close your account. Booking and payment records needed for refunds or disputes may be kept after closure.",
          ],
        },
      ]}
    />
  );
}
