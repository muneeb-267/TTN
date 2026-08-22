import Link from "next/link";
import { REVIEW_DEMOS } from "@/lib/env";

export function ReviewDemoBox({
  role,
}: {
  role: "TRAVELER" | "AGENCY" | "ADMIN";
}) {
  const rows =
    role === "TRAVELER"
      ? [REVIEW_DEMOS.traveler]
      : role === "AGENCY"
        ? [REVIEW_DEMOS.agency, REVIEW_DEMOS.agencyAlt]
        : [REVIEW_DEMOS.admin];
  return (
    <div className="mt-5 rounded-2xl border-2 border-dashed border-gold/55 bg-[#fff8ea] px-4 py-3 text-sm text-ink/80">
      <p className="text-xs font-semibold tracking-[0.18em] text-moss">REVIEW DEMO</p>
      <p className="mt-1 text-xs text-ink/55">Seeded accounts for checking the site. Not for a live domain.</p>
      <ul className="mt-2 space-y-1">
        {rows.map((row) => (
          <li key={row.email}>
            <span className="font-medium">{row.label}:</span> {row.email} / {row.password}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HomeReviewDemos() {
  return (
    <section className="bg-sand">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="rounded-3xl border-2 border-gold/40 bg-[#fffdf8] px-5 py-4">
          <p className="text-xs font-semibold tracking-[0.2em] text-moss">REVIEW DEMO ACCOUNTS</p>
          <p className="mt-1 text-sm text-ink/65">Use these to walk traveler, agency, and staff screens.</p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <Link href="/traveler/login" className="rounded-2xl border border-gold/35 px-3 py-2">
              <span className="block text-xs tracking-wide text-moss">Traveler</span>
              {REVIEW_DEMOS.traveler.email}
              <span className="block text-ink/55">{REVIEW_DEMOS.traveler.password}</span>
            </Link>
            <Link href="/agency/login" className="rounded-2xl border border-gold/35 px-3 py-2">
              <span className="block text-xs tracking-wide text-moss">Agency</span>
              {REVIEW_DEMOS.agency.email}
              <span className="block text-ink/55">{REVIEW_DEMOS.agency.password}</span>
            </Link>
            <Link href="/admin/login" className="rounded-2xl border border-gold/35 px-3 py-2">
              <span className="block text-xs tracking-wide text-moss">Admin</span>
              {REVIEW_DEMOS.admin.email}
              <span className="block text-ink/55">{REVIEW_DEMOS.admin.password}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}