import { PageShell } from "@/components/shell";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { fileDispute } from "@/app/actions/disputes";
import { supportEmail } from "@/lib/env";
import { inputClass } from "@/components/fields";
import Link from "next/link";
import { PlaceHero } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string; booking?: string }>;
}) {
  const locale = await getLocale();
  const user = await getSession();
  const { trip, booking } = await searchParams;
  const email = supportEmail();
  return (
    <PageShell locale={locale} user={user}>
      <PlaceHero
        image={SCENE.naran}
        kicker="Help center"
        title="Contact support"
        subtitle={`Booking questions, payment matching, or a report about a trip or agency. Email ${email}.`}
        compact
      />
      <div className="mx-auto max-w-2xl px-4 py-12">
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          <Link href="/legal/terms" className="card rounded-3xl p-5">
            Terms
          </Link>
          <Link href="/legal/payments" className="card rounded-3xl p-5">
            Payment terms
          </Link>
          <Link href="/legal/cancellation" className="card rounded-3xl p-5">
            Cancellation
          </Link>
          <Link href="/legal/disputes" className="card rounded-3xl p-5">
            Dispute policy
          </Link>
        </div>
        {user ? (
          <form action={fileDispute} className="card mt-10 space-y-4 rounded-3xl p-6">
            <h2 className="display text-2xl">Report an issue</h2>
            {trip ? <input type="hidden" name="tripId" value={trip} /> : null}
            {booking ? <input type="hidden" name="bookingId" value={booking} /> : null}
            <select name="kind" className={inputClass} defaultValue="TRIP">
              <option value="AGENCY">Agency issue</option>
              <option value="TRIP">Trip issue</option>
              <option value="PAYMENT">Payment issue</option>
              <option value="MISREPRESENTATION">Misrepresentation</option>
              <option value="CANCELLATION">Cancellation issue</option>
            </select>
            <textarea name="body" required rows={5} className={inputClass} placeholder="What happened?" />
            <button className="btn-gold rounded-full px-5 py-2.5 font-semibold">Submit report</button>
          </form>
        ) : (
          <p className="mt-8 text-sm">
            <Link href="/signin" className="text-link">
              Sign in
            </Link>{" "}
            to file a report.
          </p>
        )}
      </div>
    </PageShell>
  );
}
