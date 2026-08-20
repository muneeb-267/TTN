import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { EmptyState } from "@/components/empty-state";
import { listNotifications } from "@/lib/notifications";

export default async function TravelerHome() {
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") redirect("/traveler/login");
  const locale = await getLocale();
  const now = new Date();
  const bookings = await prisma.booking.findMany({
    where: { travelerId: session.id },
    include: { trip: { include: { agency: true } }, seats: true, review: true },
    orderBy: { bookedAt: "desc" },
  });
  const upcoming = bookings.filter((b) => b.trip.departureAt >= now && !["CANCELLED", "EXPIRED", "FAILED"].includes(b.status));
  const past = bookings.filter((b) => b.trip.returnAt < now || b.status === "COMPLETED");
  const pendingPay = bookings.filter((b) => b.status === "AWAITING_PAYMENT" || (b.status === "DEPOSIT_PAID" && b.remainingAmount > 0));
  const notes = await listNotifications(session.id);
  const due = notes.filter((n) => n.key.includes("pay-remaining") && !n.read);
  const saved = await prisma.savedTrip.findMany({
    where: { userId: session.id },
    include: { trip: true },
    take: 5,
  });

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="display text-5xl">Salaam, {session.name.split(" ")[0]}</h1>
        <p className="mt-3 text-ink/70">Upcoming trips, remaining payments and reviews.</p>
        {due.length ? (
          <div className="mt-6 rounded-3xl border border-gold bg-gold/15 p-5">
            <p className="font-semibold">{due[0].title}</p>
            <p className="mt-1 text-sm text-ink/70">{due[0].body}</p>
            <Link href={due[0].href || "/inbox"} className="text-link mt-3 inline-block">
              Pay now →
            </Link>
          </div>
        ) : null}
        <div className="mt-8 flex flex-wrap gap-3">
          <Link href="/trips" className="btn-gold rounded-full px-5 py-2.5 font-semibold">
            Find a trip
          </Link>
          <Link href="/traveler/bookings" className="nav-link border border-ink/10">
            All bookings
          </Link>
          <Link href="/inbox" className="nav-link border border-ink/10">
            Notifications
          </Link>
        </div>
        <section className="mt-10">
          <h2 className="display text-3xl">Upcoming trips</h2>
          <div className="mt-4 grid gap-4">
            {upcoming.map((b) => (
              <Link key={b.id} href={`/traveler/bookings/${b.id}`} className="card card-hover rounded-3xl p-5">
                <p className="text-xs text-ink/50">{b.publicRef}</p>
                <h3 className="display text-2xl">{b.trip.title}</h3>
                <p className="text-sm text-ink/70">
                  Seats {b.seats.map((s) => s.code).join(", ")} · {b.status.replaceAll("_", " ")} · paid{" "}
                  {pkr(b.depositPaidAt ? b.depositAmount : 0)} · remaining {pkr(b.status === "DEPOSIT_PAID" ? b.remainingAmount : 0)}
                </p>
                <p className="text-sm">
                  {formatDateTime(b.trip.departureAt, locale)} · {b.trip.agency.businessName}
                </p>
                <span className="text-link mt-2 inline-block text-sm">View Booking</span>
              </Link>
            ))}
            {!upcoming.length ? (
              <EmptyState title="No upcoming trips" body="Browse northern departures and lock a cinema seat." href="/trips" cta="Explore trips" />
            ) : null}
          </div>
        </section>
        <section className="mt-10">
          <h2 className="display text-3xl">Pending payments</h2>
          <div className="mt-4 grid gap-3">
            {pendingPay.map((b) => (
              <Link key={b.id} href={`/traveler/bookings/${b.id}/pay`} className="card rounded-3xl p-5">
                {b.publicRef} · {b.status.replaceAll("_", " ")} · {pkr(b.status === "AWAITING_PAYMENT" ? b.depositAmount : b.remainingAmount)} due
              </Link>
            ))}
            {!pendingPay.length ? <p className="text-sm text-ink/55">No pending payments.</p> : null}
          </div>
        </section>
        <section className="mt-10">
          <h2 className="display text-3xl">Past trips & reviews</h2>
          <div className="mt-4 grid gap-3">
            {past.map((b) => (
              <Link key={b.id} href={`/traveler/bookings/${b.id}`} className="card rounded-3xl p-5">
                {b.trip.title} · {b.review ? "Reviewed" : "Leave a review if eligible"}
              </Link>
            ))}
            {!past.length ? <p className="text-sm text-ink/55">No past trips yet.</p> : null}
          </div>
        </section>
        {saved.length ? (
          <section className="mt-10">
            <h2 className="display text-3xl">Saved trips</h2>
            <div className="mt-4 grid gap-3">
              {saved.map((s) => (
                <Link key={s.id} href={`/trips/${s.tripId}`} className="card rounded-3xl p-5">
                  {s.trip.title}
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageShell>
  );
}
