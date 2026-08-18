import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { RulesLayout } from "@/components/rules-page";

export default async function AgencyRulesPage() {
  const session = await getSession();
  if (!session || session.role === "TRAVELER") redirect("/traveler/rules");
  if (session.role !== "AGENCY" && session.role !== "ADMIN") redirect("/agency/login");
  const locale = await getLocale();
  return (
    <PageShell locale={locale} user={session}>
      <RulesLayout
        kicker="AGENCY"
        title="Agency rules"
        intro="These terms apply to agencies listing group tours on TTN. Travelers have a separate rulebook that is not shown here."
        sections={[
          {
            heading: "Listing a trip",
            points: [
              "Only approved agencies may post trips. Signup needs WhatsApp review screenshots, two CNIC photos, five client numbers, and original trip photos.",
              "Set from/to cities, dates, vehicle, seat count, itinerary, hotel links and photos.",
              "Bank name, account title and IBAN are required on every trip. JazzCash and EasyPaisa are optional.",
              "Travelers see bank transfer as the main payout, then any wallets you listed.",
            ],
          },
          {
            heading: "Bookings and payments",
            points: [
              "Travelers send the fare to the accounts on that trip. Confirm the transfer on the trip page once it hits your bank or wallet.",
              "Seats stay held for 45 minutes until payment is confirmed.",
              "The remaining 50% is due one day before departure.",
            ],
          },
          {
            heading: "Refunds",
            points: [
              "Refunds are only allowed before the traveler pays the remaining 50%.",
              "Within 24 hours of booking you must refund the deposit in full to the account they give. If you refuse, TTN fines you one seat fare on that trip.",
              "After 24 hours: of the half payment, TTN keeps 15%, you keep 15%, and 20% of the half goes back to the traveler.",
            ],
          },
          {
            heading: "Platform fee (2.5%)",
            points: [
              "TTN keeps 2.5% of the fare for paid seats. Your portal shows each trip, how many seats were booked, the fare, and the 2.5% due.",
              "Pay that fee to TTN’s listed account within 2 days after the trip returns. Submit the TID or bank receipt from your portal.",
              "If the fee is still unpaid after that window, your listing may be removed until the fee is paid.",
            ],
          },
        ]}
      />
    </PageShell>
  );
}
