import LegalPage from "@/components/legal-page";

export default function Page() {
  return (
    <LegalPage
      kicker="LEGAL"
      title="Traveler Terms"
      intro="You are booking a seat on an agency-operated group tour listed on TTN. Read the trip page, including dates, vehicle, hotels, and cancellation notes, before you pay."
      sections={[
        {
          heading: "Paying for a seat",
          points: [
            "Book at least six days before departure unless the trip says otherwise. Pay the deposit (default 50%) inside the seat-hold window to lock the seat.",
            "The remaining amount is due one day before departure. Missed remaining payment can cancel the seat under the trip and platform rules.",
            "Instant pay (card or JazzCash hosted checkout, when live) is confirmed only by the processor. Bank, EasyPaisa, and JazzCash transfers stay pending until matched against a screenshot.",
          ],
        },
        {
          heading: "On the trip",
          points: [
            "The agency runs the tour: pickup, hotels, jeeps, and day-to-day changes for weather or road closures.",
            "Give accurate traveler names and phone numbers. Bring a valid CNIC or passport if the agency or hotel requires it.",
            "Star reviews with photos are only allowed after a completed paid booking.",
          ],
        },
        {
          heading: "Problems",
          points: [
            "If hotels, vehicles, or dates do not match the listing, open a report from the booking and email support with evidence.",
            "Refunds follow the cancellation and refund pages. TTN records the split; the party holding the money sends the transfer.",
          ],
        },
      ]}
    />
  );
}
