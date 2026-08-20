import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { AgencySignupForm } from "@/components/agency-signup-form";
import { StaffSignIn } from "@/components/auth-forms";
import { PlaceHero } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";

export default async function AgencySignupPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <PlaceHero
        image={SCENE.karakoram}
        kicker="Agency"
        title="Register your agency"
        subtitle="WhatsApp reviews, CNIC photos, client numbers and original trip photos. Admin approves you before you can post departures."
      />
      <div className="mx-auto max-w-3xl px-4 py-10">
        <AgencySignupForm />
        <div className="mt-8 max-w-md">
          <StaffSignIn />
        </div>
      </div>
    </PageShell>
  );
}
