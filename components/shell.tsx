import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { setLocale } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { listNotifications } from "@/lib/notifications";
import { COMPLAINTS_EMAIL } from "@/lib/constants";

export async function Header({
  locale,
  user,
}: {
  locale: Locale;
  user: SessionUser | null;
}) {
  const copy = t(locale);
  const home =
    user?.role === "AGENCY" ? "/agency" : user?.role === "ADMIN" ? "/admin" : user ? "/traveler" : "/";
  const unread = user
    ? (await listNotifications(user.id)).filter((n) => !n.read).length
    : 0;
  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-cream/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-3 py-2 sm:px-4 sm:py-3">
        <Link href={home} className="flex items-baseline gap-2 hover:opacity-80">
          <span className="display text-2xl font-semibold text-pine">{copy.brand}</span>
          <span className="hidden text-sm text-ink/60 sm:inline">{copy.brandFull}</span>
        </Link>
        <nav className="flex flex-wrap items-center justify-end gap-1 text-sm">
          <Link href="/trips" className="nav-link">
            {copy.explore}
          </Link>
          {user?.role === "TRAVELER" ? (
            <Link href="/traveler/bookings" className="nav-link">
              {copy.myBookings}
            </Link>
          ) : null}
          {user?.role === "AGENCY" ? (
            <Link href="/agency" className="nav-link">
              {copy.dashboard}
            </Link>
          ) : null}
          {user ? (
            <Link href="/inbox" className="nav-link relative">
              Alerts
              {unread ? (
                <span className="ml-1 rounded-full bg-gold px-1.5 text-[10px] font-bold text-ink">
                  {unread}
                </span>
              ) : null}
            </Link>
          ) : null}
          <form action={setLocale}>
            <input type="hidden" name="locale" value={locale === "en" ? "ur" : "en"} />
            <button className="nav-link" type="submit">
              {locale === "en" ? copy.urdu : copy.english}
            </button>
          </form>
          {user ? (
            <form action={logout}>
              <button className="btn-pine rounded-full px-3 py-1.5" type="submit">
                {copy.signOut}
              </button>
            </form>
          ) : (
            <Link href="/" className="btn-pine rounded-full px-3 py-1.5">
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
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-8 sm:flex-row sm:items-center sm:justify-between">
        <p className="display text-2xl">TTN</p>
        <div className="max-w-md text-sm text-sand/80">
          <p>
            5% platform fee per seat. Book 6–7 days ahead and pay 50% to lock the seat. One day
            before, pay the rest. Refunds only before the remaining 50% is paid. Within 24 hours:
            agency must refund in full. After 24 hours: of the half payment, 15% stays with TTN,
            15% with the agency, 20% returns to you.
          </p>
          <p className="mt-2">
            Complaints:{" "}
            <a href={`mailto:${COMPLAINTS_EMAIL}`} className="text-gold-2 underline decoration-gold/40 underline-offset-2 hover:text-gold">
              {COMPLAINTS_EMAIL}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

export async function PageShell({
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
