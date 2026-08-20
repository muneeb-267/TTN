import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { LoginForm } from "@/components/auth-forms";
import { AuthSplit } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";

export default async function AdminLoginPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <AuthSplit
        kicker="Admin"
        title="TTN control room"
        body="Platform settings, settlements, agencies and bookings."
        image={SCENE.kkh}
        imageAlt="Karakoram Highway through Upper Hunza"
      >
        <LoginForm role="ADMIN" />
        <p className="mt-4 text-sm">
          <Link href="/" className="text-link underline">
            Back home
          </Link>
        </p>
      </AuthSplit>
    </PageShell>
  );
}
