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
    <header className="site-header sticky top-0 z-40 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-3 py-2.5 sm:px-5 md:h-[4.25rem] md:flex-nowrap md:py-0">
        <Link href={home} className="group order-1 flex shrink-0 items-center gap-2 sm:gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pine text-gold-2 shadow-[0_0_0_1px_rgba(201,163,106,0.45)] transition group-hover:bg-moss sm:h-10 sm:w-10">
            <span className="display text-base leading-none sm:text-lg">T</span>
          </span>
          <span className="min-w-0">
            <span className="display block text-[1.35rem] leading-none text-pine sm:text-[1.65rem]">
              {copy.brand}
            </span>
            <span className="mt-1 hidden text-[0.65rem] tracking-[0.28em] text-moss sm:block">
              {copy.brandFull.toUpperCase()}
            </span>
          </span>
        </Link>
        <nav className="order-3 flex w-full flex-wrap items-center gap-x-0.5 gap-y-1 text-[13px] sm:text-sm md:order-2 md:w-auto md:flex-1 md:flex-nowrap">
          <Link href="/trips" className="nav-link whitespace-nowrap">
            {copy.explore}
          </Link>
          {user?.role === "TRAVELER" ? (
            <Link href="/traveler/bookings" className="nav-link whitespace-nowrap">
              {copy.myBookings}
            </Link>
          ) : null}
          {user?.role === "AGENCY" ? (
            <Link href="/agency" className="nav-link whitespace-nowrap">
              {copy.dashboard}
            </Link>
          ) : null}
          {user ? (
            <Link href="/inbox" className="nav-link relative whitespace-nowrap">
              Alerts
              {unread ? (
                <span className="ml-1 inline-flex min-w-5 items-center justify-center rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-bold leading-none text-ink">
                  {unread}
                </span>
              ) : null}
            </Link>
          ) : null}
        </nav>
        <div className="order-2 ms-auto flex shrink-0 items-center gap-1.5 md:order-3 md:ms-0">
          <form action={setLocale}>
            <input type="hidden" name="locale" value={locale === "en" ? "ur" : "en"} />
            <button
              className="rounded-full border border-gold/40 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-pine transition hover:border-gold hover:bg-gold/20 sm:px-3 sm:py-1.5 sm:text-xs"
              type="submit"
            >
              {locale === "en" ? copy.urdu : copy.english}
            </button>
          </form>
          {user ? (
            <form action={logout} className="flex items-center gap-2">
              <span className="hidden max-w-[8rem] truncate text-sm text-ink/55 lg:inline">
                {user.name.split(" ")[0]}
              </span>
              <button className="btn-pine rounded-full px-3 py-1.5 text-xs sm:px-4 sm:text-sm" type="submit">
                {copy.signOut}
              </button>
            </form>
          ) : (
            <Link href="/" className="btn-gold rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:text-sm">
              {copy.signIn}
            </Link>
          )}
        </div>
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
