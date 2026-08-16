import Link from "next/link";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { LoginForm } from "@/components/auth-forms";

export default async function AdminLoginPage() {
  const locale = await getLocale();
  const user = await getSession();
  return (
    <PageShell locale={locale} user={user}>
      <div className="mx-auto max-w-md px-4 py-16">
        <h1 className="display mb-6 text-4xl">TTN admin</h1>
        <div className="card rounded-3xl p-6">
          <LoginForm role="ADMIN" demoEmail="admin@ttn.pk" demoPassword="TTN-Admin-2026" />
        </div>
        <p className="mt-4 text-center text-sm">
          <Link href="/" className="text-link">
            Back home
          </Link>
        </p>
      </div>
    </PageShell>
  );
}
