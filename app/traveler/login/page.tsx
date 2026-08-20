import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { LoginForm } from "@/components/auth-forms";
import { AuthSplit } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";

export default async function TravelerLoginPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <AuthSplit
        kicker="Traveler"
        title="Sign in to pick your seat"
        body="Separate traveler login. Book 6–7 days ahead, pay half, and settle the rest one day before departure."
        image={SCENE.attabad}
        imageAlt="Attabad Lake, Hunza"
      >
          <LoginForm role="TRAVELER" demoEmail="sara@ttn.pk" demoPassword="Travel123!" />
          <p className="mt-5 text-sm text-ink/60">
            New here?{" "}
            <Link href="/traveler/signup" className="text-link underline">
              Create a traveler account
            </Link>
          </p>
          <p className="mt-3 text-sm text-ink/70">
            Agency?{" "}
            <Link href="/agency/login" className="text-link underline">
              Sign in as an agency
            </Link>
            {" · "}
            <Link href="/signin" className="text-link underline">
              Choose another role
            </Link>
          </p>
      </AuthSplit>
    </PageShell>
  );
}
