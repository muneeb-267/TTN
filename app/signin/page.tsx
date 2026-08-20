import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { StaffSignIn } from "@/components/auth-forms";

export default async function SignInChooserPage() {
  const locale = await getLocale();
  const user = await getSession();
  const copy = t(locale);

  if (user?.role === "AGENCY") redirect("/agency");
  if (user?.role === "ADMIN") redirect("/admin");
  if (user) redirect("/traveler");

  return (
    <PageShell locale={locale} user={user}>
      <section className="signin-stage">
        <div className="relative mx-auto max-w-5xl px-4 py-14 sm:py-20">
          <p className="text-sm font-semibold tracking-[0.35em] text-gold-2">TTN · TRAVEL TO NORTH</p>
          <h1 className="display mt-3 text-5xl text-sand sm:text-6xl">{copy.signInTitle}</h1>
          <p className="mt-4 max-w-2xl text-lg text-sand">{copy.signInLead}</p>
          <p className="mt-2 text-sm font-semibold tracking-wide text-gold">{copy.chooseRole}</p>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            <Link href="/traveler/login" className="signin-card signin-card-traveler">
              <span className="signin-kicker">Traveler</span>
              <h2 className="display mt-4 text-4xl text-pine">{copy.signInTraveler}</h2>
              <p className="signin-blurb">{copy.travelerBlurb}</p>
              <span className="signin-cta signin-cta-gold">{copy.traveler}</span>
            </Link>
            <Link href="/agency/login" className="signin-card signin-card-agency">
              <span className="signin-kicker">Agency</span>
              <h2 className="display mt-4 text-4xl text-pine">{copy.signInAgency}</h2>
              <p className="signin-blurb">{copy.agencyBlurb}</p>
              <span className="signin-cta signin-cta-pine">{copy.agency}</span>
            </Link>
          </div>

          <p className="mt-10">
            <Link href="/#trips" className="signin-guest">
              {copy.continueAsGuest}
            </Link>
          </p>
          <div className="mx-auto mt-8 max-w-md text-left">
            <StaffSignIn />
          </div>
        </div>
      </section>
    </PageShell>
  );
}
