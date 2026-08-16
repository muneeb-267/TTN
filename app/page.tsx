import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale, t } from "@/lib/i18n";
import { PageShell } from "@/components/shell";

export default async function HomePage() {
  const locale = await getLocale();
  const user = await getSession();
  const copy = t(locale);
  return (
    <PageShell locale={locale} user={user}>
      <section className="grain relative overflow-hidden bg-pine text-sand">
        <div
          className="absolute inset-0 opacity-40"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1800&q=80)",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-pine/40 via-pine/70 to-pine" />
        <div className="relative mx-auto max-w-6xl px-4 py-20 sm:py-28">
          <p className="text-sm tracking-[0.35em] text-gold-2">PAKISTAN · NORTHBOUND</p>
          <h1 className="display mt-4 max-w-3xl text-5xl leading-[0.95] sm:text-7xl">{copy.brandFull}</h1>
          <p className="mt-5 max-w-xl text-lg text-sand/85">{copy.tagline}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/trips" className="rounded-full bg-gold px-5 py-2.5 font-semibold text-ink">
              {copy.explore}
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <p className="text-sm tracking-[0.25em] text-moss">{copy.chooseRole}</p>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <RoleCard
            href="/traveler/login"
            title={copy.traveler}
            body={copy.travelerBlurb}
            cta="Enter as traveler"
          />
          <RoleCard
            href="/agency/login"
            title={copy.agency}
            body={copy.agencyBlurb}
            cta="Enter as agency"
          />
        </div>
      </section>
    </PageShell>
  );
}

function RoleCard({
  href,
  title,
  body,
  cta,
}: {
  href: string;
  title: string;
  body: string;
  cta: string;
}) {
  return (
    <Link
      href={href}
      className="card group rounded-[32px] p-8 transition hover:-translate-y-1 hover:border-gold/40"
    >
      <h2 className="display text-4xl">{title}</h2>
      <p className="mt-4 text-ink/70">{body}</p>
      <span className="mt-8 inline-flex rounded-full bg-pine px-4 py-2 text-sm text-sand group-hover:bg-moss">
        {cta}
      </span>
    </Link>
  );
}
