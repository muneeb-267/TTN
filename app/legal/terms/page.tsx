import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="LEGAL"
      title="Terms & Conditions"
      intro="These are the operating rules of the TTN marketplace. They describe how the product works today. They are not a substitute for advice from a Pakistani lawyer, and they do not claim SBP, PTA, or other regulatory approval."
      sections={[
        {
          heading: "What TTN is",
          points: [
            "TTN (Travel To North) is a website that lists group tours to northern Pakistan offered by independent travel agencies.",
            "When you book a seat, the tour contract is between you and that agency. TTN provides the listing, seat map, payment matching, and dispute tools.",
            "TTN is not a tour operator, carrier, hotel, or insurer, and does not employ the agencies on the site.",
          ],
        },
        {
          heading: "Accounts",
          points: [
            "You must give a real name, email, and (for agencies) verification documents. Fake or borrowed identity can lead to suspension.",
            "Keep your password private. TTN staff will never ask for it in chat or email.",
            "TTN may suspend or close an account that misuses the marketplace, including fake photos, unpaid platform fees, or chargeback abuse.",
          ],
        },
        {
          heading: "Bookings",
          points: [
            "A booking is a seat (or seats) on a dated departure. The agency’s itinerary, vehicle, and hotel notes on the trip page are what you are buying.",
            "Past trips cannot be booked. Unpublished or delisted agencies do not appear for new bookings.",
            "TTN may hold a seat for a short window while payment is confirmed. If payment is not confirmed in time, the seat is released.",
          ],
        },
      ]}
    />
  );
}
