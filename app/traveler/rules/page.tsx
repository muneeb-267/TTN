import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { RulesLayout } from "@/components/rules-page";

export default async function TravelerRulesPage() {
  const session = await getSession();
  if (session?.role === "AGENCY") redirect("/agency/rules");
  const locale = await getLocale();
  return (
    <PageShell locale={locale} user={session}>
      <RulesLayout
        kicker="TRAVELER"
        title="Traveler rules"
        intro="These terms apply when you book a northern Pakistan group tour on TTN. Agencies have a separate rulebook that is not shown here."
        sections={[
          {
            heading: "Booking",
            points: [
              "Book 6–7 days before departure. Pick cinema-style seats on the trip page.",
              "Pay 50% to lock those seats. A payment slip is issued once the transfer is confirmed.",
              "Pay the remaining 50% one day before departure. You will get an in-app reminder.",
              "Unpaid holds expire after 45 minutes and the seats go back on sale.",
            ],
          },
          {
            heading: "Payment",
            points: [
              "Bank / Raast is the main option. Send the exact amount to the account shown at checkout and put your booking reference in the narration.",
              "EasyPaisa and JazzCash appear only if that agency listed a wallet for the trip.",
              "Card checkout (Visa / Mastercard) is available when Stripe is live.",
              "Seats lock after the transfer is matched. Keep your TID or bank receipt.",
            ],
          },
          {
            heading: "Refunds",
            points: [
              "Refunds are only possible before you pay the remaining 50%.",
              "Within 24 hours of booking: the agency must refund you in full to the account you give.",
              "If they refuse a same-day full refund, TTN fines them one seat fare on that trip.",
              "After 24 hours: of the half payment, 15% stays with TTN, 15% with the agency, and 20% of the half returns to you.",
            ],
          },
          {
            heading: "After the trip",
            points: [
              "When the trip has returned, you may leave a star review with photos.",
              "Hotel names and links on the trip page are provided by the agency. Check them before you travel.",
              "Complaints about a listing, payment or refund go to complaints@ttn.pk.",
            ],
          },
        ]}
      />
    </PageShell>
  );
}
