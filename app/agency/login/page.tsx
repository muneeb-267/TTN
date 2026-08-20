import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { LoginForm } from "@/components/auth-forms";
import { AuthSplit } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";

export default async function AgencyLoginPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <AuthSplit
        kicker="Agency"
        title="Agency portal"
        body="Post trips with from/to dates, vehicle and seat count. TTN draws the cinema map. Registration needs WhatsApp review screenshots, two CNIC photos, five client numbers, and original trip photos."
        image={SCENE.passu}
        imageAlt="Passu Cathedral, Upper Hunza"
      >
          <LoginForm role="AGENCY" demoEmail="hunza@karakoram.pk" demoPassword="Agency123!" />
          <p className="mt-5 text-sm text-ink/60">
            New agency?{" "}
            <Link href="/agency/signup" className="text-link underline">
              Register your agency
            </Link>
          </p>
          <p className="mt-3 text-sm text-ink/70">
            Traveler?{" "}
            <Link href="/traveler/login" className="text-link underline">
              Sign in as a traveler
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
