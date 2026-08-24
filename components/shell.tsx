import Link from "next/link";
import { logout } from "@/app/actions/auth";
import { setLocale } from "@/app/actions/auth";
import type { SessionUser } from "@/lib/auth";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { listNotifications } from "@/lib/notifications";
import { supportEmail } from "@/lib/env";
import { SOCIAL_LINKS } from "@/lib/constants";

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
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-pine text-gold-2 shadow-[0_0_0_1px_rgba(194,154,107,0.45)] transition duration-300 group-hover:bg-moss sm:h-10 sm:w-10">
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
          {!user ? (
            <Link href="/traveler/rules" className="nav-link whitespace-nowrap">
              {copy.rules}
            </Link>
          ) : null}
          {user?.role === "AGENCY" ? (
            <>
              <Link href="/agency" className="nav-link whitespace-nowrap">
                {copy.dashboard}
              </Link>
              <Link href="/agency/trips" className="nav-link whitespace-nowrap">
                {copy.postedTrips}
              </Link>
              <Link href="/agency/bookings" className="nav-link whitespace-nowrap">
                {copy.agencyBookings}
              </Link>
              <Link href="/agency/gallery" className="nav-link whitespace-nowrap">
                {copy.agencyProfile}
              </Link>
              <Link href="/agency/rules" className="nav-link whitespace-nowrap">
                {copy.rules}
              </Link>
            </>
          ) : null}
          {user?.role === "TRAVELER" ? (
            <Link href="/traveler/rules" className="nav-link whitespace-nowrap">
              {copy.rules}
            </Link>
          ) : null}
          {user?.role === "ADMIN" ? (
            <>
              <Link href="/traveler/rules" className="nav-link whitespace-nowrap">
                Traveler rules
              </Link>
              <Link href="/agency/rules" className="nav-link whitespace-nowrap">
                Agency rules
              </Link>
            </>
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
              className="rounded-full border border-gold/40 px-2.5 py-1 text-[10px] font-semibold tracking-[0.18em] text-pine transition duration-300 hover:border-gold hover:bg-gold/20 sm:px-3 sm:py-1.5 sm:text-xs"
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
            <Link href="/signin" className="btn-gold rounded-full px-3 py-1.5 text-xs font-semibold sm:px-4 sm:text-sm">
              {copy.signIn}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

export function Footer({ user }: { user: SessionUser | null }) {
  const year = new Date().getFullYear();
  const email = supportEmail();
  if (user?.role === "AGENCY") {
    return (
      <footer className="mt-auto border-t border-gold/20 bg-pine text-sand">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-6 text-sm text-sand/70">
          <p>© {year} TTN — Travel To North</p>
          <nav className="flex flex-wrap gap-4">
            <Link href="/agency/rules" className="transition hover:text-gold">
              Rules
            </Link>
            <Link href="/help" className="transition hover:text-gold">
              Help
            </Link>
            <a href={`mailto:${email}`} className="transition hover:text-gold">
              {email}
            </a>
          </nav>
        </div>
      </footer>
    );
  }
  const rulesHref = user?.role === "ADMIN" ? null : "/traveler/rules";
  return (
    <footer className="mt-auto border-t border-gold/20 bg-pine text-sand">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="display text-3xl">TTN</p>
          <p className="mt-2 text-sm tracking-[0.2em] text-gold-2">TRAVEL TO NORTH</p>
          <p className="mt-4 max-w-xs text-sm text-sand/70">
            Group tours to Hunza, Skardu, Naran and Swat, from Pakistan’s big cities.
          </p>
          <p className="mt-3 text-sm font-semibold tracking-wide text-gold-2">
            Real trips. Real seats. Real dates.
          </p>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-2">EXPLORE</p>
          <ul className="mt-4 space-y-2 text-sm text-sand/80">
            <li>
              <Link href="/trips" className="transition hover:text-gold">
                Trips
              </Link>
            </li>
            {user?.role === "ADMIN" ? (
              <>
                <li>
                  <Link href="/traveler/rules" className="transition hover:text-gold">
                    Traveler rules
                  </Link>
                </li>
                <li>
                  <Link href="/agency/rules" className="transition hover:text-gold">
                    Agency rules
                  </Link>
                </li>
              </>
            ) : (
              <li>
                <Link href={rulesHref || "/traveler/rules"} className="transition hover:text-gold">
                  Rules
                </Link>
              </li>
            )}
            <li>
              <Link href="/help" className="transition hover:text-gold">
                Help Center
              </Link>
            </li>
            <li>
              <Link href="/legal/terms" className="transition hover:text-gold">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/legal/privacy" className="transition hover:text-gold">
                Privacy
              </Link>
            </li>
            <li>
              <a href={`mailto:${email}`} className="transition hover:text-gold">
                {email}
              </a>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-2">ACCOUNT</p>
          <ul className="mt-4 space-y-2 text-sm text-sand/80">
            {user ? (
              <>
                <li>
                  <Link
                    href={user.role === "ADMIN" ? "/admin" : "/traveler"}
                    className="transition hover:text-gold"
                  >
                    {user.role === "ADMIN" ? "TTN control" : "My bookings"}
                  </Link>
                </li>
              </>
            ) : (
              <>
                <li>
                  <Link href="/signin" className="transition hover:text-gold">
                    Sign in
                  </Link>
                </li>
                <li>
                  <Link href="/traveler/login" className="transition hover:text-gold">
                    Traveler sign in
                  </Link>
                </li>
              </>
            )}
          </ul>
        </div>
        <div>
          <p className="text-xs font-semibold tracking-[0.22em] text-gold-2">FOLLOW</p>
          <div className="mt-4 flex items-center gap-3">
            <SocialLink href={SOCIAL_LINKS.instagram} label="Instagram">
              <InstagramIcon />
            </SocialLink>
            <SocialLink href={SOCIAL_LINKS.facebook} label="Facebook">
              <FacebookIcon />
            </SocialLink>
            <SocialLink href={SOCIAL_LINKS.twitter} label="X">
              <XIcon />
            </SocialLink>
          </div>
          <p className="mt-4 text-sm text-sand/60">@traveltonorth</p>
        </div>
      </div>
      <div className="border-t border-sand/10">
        <p className="mx-auto max-w-6xl px-4 py-5 text-xs text-sand/50">
          © {year} TTN — Travel To North. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

function SocialLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      aria-label={label}
      className="grid h-10 w-10 place-items-center rounded-full border border-sand/20 text-sand transition duration-300 hover:border-gold hover:bg-gold hover:text-ink"
    >
      {children}
    </a>
  );
}

function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.4" cy="6.6" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
      <path d="M14.5 8.5V6.8c0-.7.5-1.3 1.2-1.3H17V3h-1.8C13 3 11.5 4.6 11.5 6.7v1.8H9.5V11h2v10h3v-10h2.2l.3-2.5h-2.5z" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
      <path d="M18.9 3H22l-6.8 7.8L23 21h-6.3l-4.9-6.5L6.2 21H3.1l7.3-8.4L2 3h6.5l4.4 5.9L18.9 3zm-1.1 16.2h1.8L7.3 4.7H5.4l12.4 14.5z" />
    </svg>
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
      <Footer user={user} />
    </>
  );
}
