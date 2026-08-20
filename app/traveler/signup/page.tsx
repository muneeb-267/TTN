import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { TravelerSignupForm } from "@/components/auth-forms";
import { AuthSplit } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";

export default async function TravelerSignupPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <AuthSplit
        kicker="Traveler"
        title="Join as a traveler"
        body="Browse north tours from every major city, choose cinema seats, and lock them with a 50% deposit."
        image={SCENE.naran}
        imageAlt="Alpine lake on the Naran road"
      >
        <TravelerSignupForm />
      </AuthSplit>
    </PageShell>
  );
}
