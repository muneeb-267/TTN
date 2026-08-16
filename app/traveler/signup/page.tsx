import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { TravelerSignupForm } from "@/components/auth-forms";

export default async function TravelerSignupPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto max-w-lg px-4 py-12">
        <h1 className="display text-5xl">Join as a traveler</h1>
        <p className="mt-3 mb-8 text-ink/70">
          Browse north tours from every major city, choose cinema seats, and lock them with a 50%
          deposit.
        </p>
        <div className="card rounded-3xl p-6">
          <TravelerSignupForm />
        </div>
      </div>
    </PageShell>
  );
}
