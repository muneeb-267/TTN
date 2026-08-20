import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { PageShell } from "@/components/shell";

export default async function SignInChooserPage() {
  const locale = await getLocale();
  const user = await getSession();
  const copy = t(locale);

  if (user?.role === "AGENCY") redirect("/agency");
  if (user?.role === "ADMIN") redirect("/admin");
  if (user) redirect("/traveler");

  return (
    <PageShell locale={locale} user={user}>
      <section className="signin-stage grain">
        <div className="relative mx-auto max-w-5xl px-4 py-16 sm:py-20">
          <p className="text-sm tracking-[0.35em] text-gold-2">TTN · TRAVEL TO NORTH</p>
          <h1 className="display mt-3 text-5xl text-sand sm:text-6xl">{copy.signInTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-sand/80">{copy.signInLead}</p>
          <p className="mt-2 text-sm tracking-wide text-gold-2/90">{copy.chooseRole}</p>

          <div className="mt-10 grid gap-5 md:grid-cols-2" style={{ perspective: "1200px" }}>
            <Link href="/traveler/login" className="signin-card card rounded-3xl p-7 text-ink">
              <p className="text-xs font-semibold tracking-[0.28em] text-moss">TRAVELER</p>
              <h2 className="display mt-2 text-4xl">{copy.signInTraveler}</h2>
              <p className="mt-3 text-ink/70">{copy.travelerBlurb}</p>
              <span className="btn-gold mt-8 inline-flex rounded-full px-5 py-2.5 font-semibold">
                {copy.traveler}
              </span>
            </Link>
            <Link href="/agency/login" className="signin-card card rounded-3xl p-7 text-ink">
              <p className="text-xs font-semibold tracking-[0.28em] text-moss">AGENCY</p>
              <h2 className="display mt-2 text-4xl">{copy.signInAgency}</h2>
              <p className="mt-3 text-ink/70">{copy.agencyBlurb}</p>
              <span className="btn-pine mt-8 inline-flex rounded-full px-5 py-2.5 font-semibold">
                {copy.agency}
              </span>
            </Link>
          </div>

          <p className="mt-10">
            <Link href="/#trips" className="text-gold-2 underline decoration-gold/50 underline-offset-4">
              {copy.continueAsGuest}
            </Link>
          </p>
        </div>
      </section>
    </PageShell>
  );
}
