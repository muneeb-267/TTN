import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { setLocale } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function Header({
  locale,
  user,
}: {
  locale: Locale;
  user: SessionUser | null;
}) {
  const copy = t(locale);
  const home =
    user?.role === "AGENCY" ? "/agency" : user?.role === "ADMIN" ? "/admin" : user ? "/traveler" : "/";
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
        <Link href={home} className="flex items-baseline gap-2">
          <span className="display text-2xl font-semibold text-pine">{copy.brand}</span>
          <span className="hidden text-sm text-ink/60 sm:inline">{copy.brandFull}</span>
        </Link>
        <nav className="flex items-center gap-2 text-sm sm:gap-3">
          <Link href="/trips" className="rounded-full px-3 py-1.5 hover:bg-sand">
            {copy.explore}
          </Link>
          {user?.role === "TRAVELER" ? (
            <Link href="/traveler/bookings" className="rounded-full px-3 py-1.5 hover:bg-sand">
              {copy.myBookings}
            </Link>
          ) : null}
          {user?.role === "AGENCY" ? (
            <Link href="/agency" className="rounded-full px-3 py-1.5 hover:bg-sand">
              {copy.dashboard}
            </Link>
          ) : null}
          <form action={setLocale}>
            <input type="hidden" name="locale" value={locale === "en" ? "ur" : "en"} />
            <button className="rounded-full px-3 py-1.5 hover:bg-sand" type="submit">
              {locale === "en" ? copy.urdu : copy.english}
            </button>
          </form>
          {user ? (
            <form action={logout}>
              <button className="rounded-full bg-pine px-3 py-1.5 text-sand" type="submit">
                {copy.signOut}
              </button>
            </form>
          ) : (
            <Link href="/" className="rounded-full bg-pine px-3 py-1.5 text-sand">
              {copy.signIn}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-ink/10 bg-pine text-sand">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="display text-2xl">TTN</p>
        <p className="max-w-md text-sm text-sand/80">
          Travel To North lists group tours across northern Pakistan. 5% platform fee per seat.
          Same-day cancellations can be refunded in full. After one day, TTN keeps 30% of the
          deposit and 20% returns to the traveler.
        </p>
      </div>
    </footer>
  );
}

export function PageShell({
  children,
  locale,
  user,
}: {
  children: React.ReactNode;
  locale: Locale;
  user: SessionUser | null;
}) {
  return (
    <>
      <Header locale={locale} user={user} />
      <main className="flex-1">{children}</main>
      <Footer />
    </>
  );
}