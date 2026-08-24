import type { Metadata } from "next";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { LoginForm } from "@/components/auth-forms";
import { AuthSplit } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";
import { REVIEW_DEMOS, showReviewDemos } from "@/lib/env";
import { ReviewDemoBox } from "@/components/review-demo";

export const metadata: Metadata = {
  title: "Staff",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const locale = await getLocale();
  const user = await getSession();
  const review = showReviewDemos();
  return (
    <PageShell locale={locale} user={user}>
      <AuthSplit
        kicker="Admin"
        title="TTN control room"
        body="Platform settings, settlements, agencies and bookings."
        image={SCENE.kkh}
        imageAlt="Karakoram Highway through Upper Hunza"
      >
        <LoginForm
          role="ADMIN"
          demoEmail={review ? REVIEW_DEMOS.admin.email : undefined}
          demoPassword={review ? REVIEW_DEMOS.admin.password : undefined}
        />
        {review ? <ReviewDemoBox role="ADMIN" /> : null}
        <p className="mt-4 text-sm">
          <Link href="/" className="text-link underline">
            Back home
          </Link>
        </p>
      </AuthSplit>
    </PageShell>
  );
}
