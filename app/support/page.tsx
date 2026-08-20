import { PageShell } from "@/components/shell";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { fileDispute } from "@/app/actions/disputes";
import { COMPLAINTS_EMAIL } from "@/lib/constants";
import { inputClass } from "@/components/fields";
import Link from "next/link";

export default async function SupportPage({
  searchParams,
}: {
  searchParams: Promise<{ trip?: string; booking?: string }>;
}) {
  const locale = await getLocale();
  const user = await getSession();
  const { trip, booking } = await searchParams;
  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto max-w-2xl px-4 py-12">
        <p className="text-xs tracking-[0.3em] text-moss">HELP CENTER</p>
        <h1 className="display mt-3 text-5xl">Contact support</h1>
        <p className="mt-4 text-ink/70">
          Booking questions, payment matching, or a report about a trip or agency. Email{" "}
          <a className="text-link" href={`mailto:${COMPLAINTS_EMAIL}`}>
            {COMPLAINTS_EMAIL}
          </a>{" "}
          or send a report below.
        </p>
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
            <Link href="/traveler/login" className="text-link">
              Sign in
            </Link>{" "}
            to file a report.
          </p>
        )}
      </div>
    </PageShell>
  );
}
