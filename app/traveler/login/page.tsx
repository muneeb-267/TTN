import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { LoginForm } from "@/components/auth-forms";
import { AuthSplit } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";
import { REVIEW_DEMOS, showReviewDemos } from "@/lib/env";
import { ReviewDemoBox } from "@/components/review-demo";

export default async function TravelerLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ oauth_error?: string }>;
}) {
  const locale = await getLocale();
  const user = await getSession();
  const review = showReviewDemos();
  const query = await searchParams;
  return (
    <PageShell locale={locale} user={user}>
      <AuthSplit
        kicker="Traveler"
        title="Sign in to pick your seat"
        body="Book 6–7 days ahead, pay half, and settle the rest one day before departure. Real trips. Real seats. Real dates."
        image={SCENE.attabad}
        imageAlt="Attabad Lake, Hunza"
      >
        <LoginForm
          role="TRAVELER"
          demoEmail={review ? REVIEW_DEMOS.traveler.email : undefined}
          demoPassword={review ? REVIEW_DEMOS.traveler.password : undefined}
          oauthError={query.oauth_error}
        />
        {review ? <ReviewDemoBox role="TRAVELER" /> : null}
        <p className="mt-5 text-sm text-ink/60">
          New here?{" "}
          <Link href="/traveler/signup" className="text-link underline">
            Create a traveler account
          </Link>
        </p>
        <p className="mt-3 text-sm text-ink/70">
          Agency?{" "}
          <Link href="/agency/login" className="text-link underline">
            Grow your travel business on TTN
          </Link>
        </p>
      </AuthSplit>
    </PageShell>
  );
}
