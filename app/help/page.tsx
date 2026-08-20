import { PageShell } from "@/components/shell";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import Link from "next/link";

export default async function HelpPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="display text-5xl">Help Center</h1>
        <ul className="mt-8 space-y-3 text-ink/80">
          <li>
            <Link href="/trips" className="text-link">
              Find a trip
            </Link>
          </li>
          <li>
            <Link href="/support" className="text-link">
              Contact support / report an issue
            </Link>
          </li>
          <li>
            <Link href="/legal/cancellation" className="text-link">
              Cancellation and refunds
            </Link>
          </li>
          <li>
            <Link href="/traveler/bookings" className="text-link">
              Booking support
            </Link>
          </li>
        </ul>
      </div>
    </PageShell>
  );
}
