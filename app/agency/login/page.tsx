import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { LoginForm } from "@/components/auth-forms";

export default async function AgencyLoginPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-sm tracking-[0.3em] text-moss">AGENCY</p>
          <h1 className="display mt-2 text-5xl">Agency portal</h1>
          <p className="mt-4 text-ink/70">
            Post trips with from/to dates, vehicle and seat count. TTN draws the cinema map.
            Registration needs WhatsApp review screenshots, two CNIC photos, five client numbers,
            and original trip photos.
          </p>
        </div>
        <div className="card rounded-3xl p-6 sm:p-8">
          <LoginForm role="AGENCY" demoEmail="hunza@karakoram.pk" demoPassword="Agency123!" />
          <p className="mt-5 text-sm text-ink/60">
            New agency?{" "}
            <Link href="/agency/signup" className="text-link underline">
              Register your agency
            </Link>
          </p>
          <p className="mt-3 text-sm text-ink/55">
            Traveler?{" "}
            <Link href="/traveler/login" className="text-link underline">
              Sign in as a traveler
            </Link>
            {" · "}
            <Link href="/signin" className="text-link underline">
              Choose another role
            </Link>
          </p>
        </div>
      </div>
    </PageShell>
  );
}
