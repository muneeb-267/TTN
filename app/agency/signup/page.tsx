import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { AgencySignupForm } from "@/components/agency-signup-form";
import { PlaceHero } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";
import { formatBps } from "@/lib/money";
import { getFinanceRates } from "@/lib/platform-fees";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AgencySignupPage() {
  const locale = await getLocale();
  const user = await getSession();
  const rates = await getFinanceRates();
  const record =
    user?.role === "AGENCY"
      ? await prisma.user.findUnique({ where: { id: user.id }, include: { agency: true } })
      : null;
  if (record?.agency) redirect("/agency");
  return (
    <PageShell locale={locale} user={user}>
      <PlaceHero
        image={SCENE.karakoram}
        kicker="Become a TTN agency"
        title="Join as a verified operator"
        subtitle={`No monthly fee. ${formatBps(rates.commissionBps)} on successful bookings. Typical review time: 1–2 working days.`}
      />
      <div className="mx-auto max-w-3xl px-4 py-10">
        {record ? (
          <p className="mb-6 rounded-2xl border border-gold/40 bg-[#fff8ea] px-4 py-3 text-sm text-ink/75">
            Signed in as {record.email}. Finish the agency file below — no extra password needed.
          </p>
        ) : null}
        <AgencySignupForm
          oauthAccount={record ? { name: record.name, email: record.email } : undefined}
        />
        <p className="mt-8 text-center text-sm text-ink/60">
          Already listed?{" "}
          <Link href="/agency/login" className="text-link underline">
            Sign in to the agency portal
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
