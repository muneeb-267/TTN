import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { LoginForm } from "@/components/auth-forms";

export default async function TravelerLoginPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm tracking-[0.3em] text-moss">TRAVELER</p>
          <h1 className="display mt-2 text-5xl">Sign in to pick your seat</h1>
          <p className="mt-4 text-ink/70">
            Separate traveler login. Book 6–7 days ahead, pay half, and settle the rest one day
            before departure.
          </p>
        </div>
        <div className="card rounded-3xl p-6 sm:p-8">
          <LoginForm role="TRAVELER" demoEmail="sara@ttn.pk" demoPassword="Travel123!" />
          <p className="mt-5 text-sm text-ink/60">
            New here?{" "}
            <Link href="/traveler/signup" className="text-moss underline">
              Create a traveler account
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
