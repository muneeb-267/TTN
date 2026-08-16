import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { AgencySignupForm } from "@/components/agency-signup-form";

export default async function AgencySignupPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto max-w-3xl px-4 py-12">
        <h1 className="display text-5xl">Register your agency</h1>
        <p className="mt-3 mb-8 max-w-2xl text-ink/70">
          WhatsApp review screenshots (20+), CNIC photos of two people, and at least five client
          phone numbers for confirmation. Original trip photos too — not AI generated. Admin
          approves you before you can post departures.
        </p>
        <AgencySignupForm />
      </div>
    </PageShell>
  );
}
