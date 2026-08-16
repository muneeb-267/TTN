import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { SeatMap } from "@/components/seat-map";

export default async function AgencyTripBookingsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const locale = await getLocale();
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency) redirect("/agency/signup");
  const trip = await prisma.trip.findUnique({
    where: { id },
    include: {
      seats: { orderBy: [{ row: "asc" }, { col: "asc" }] },
      bookings: {
        include: { traveler: true, seats: true, payments: true },
        orderBy: { bookedAt: "desc" },
      },
    },
  });
  if (!trip || trip.agencyId !== agency.id) notFound();
  const filled = trip.seats.filter((s) => s.bookingId).length;

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <Link href="/agency" className="text-link text-sm">
          ← Agency portal
        </Link>
        <h1 className="display mt-3 text-4xl">{trip.title}</h1>
        <p className="mt-2 text-ink/70">
          {filled}/{trip.seatCount} seats filled · {trip.bookings.length} bookings
        </p>
        <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
          <SeatMap
            readOnly
            seats={trip.seats.map((s) => ({
              code: s.code,
              row: s.row,
              col: s.col,
              aisleAfter: s.aisleAfter,
              taken: Boolean(s.bookingId),
            }))}
          />
          <div className="space-y-3">
            {trip.bookings.map((b) => (
              <div key={b.id} className="card rounded-3xl p-5">
                <p className="text-xs tracking-widest text-moss">{b.publicRef}</p>
                <h2 className="display text-2xl">{b.traveler.name}</h2>
                <p className="text-sm text-ink/70">
                  {b.traveler.email}
                  {b.traveler.phone ? ` · ${b.traveler.phone}` : ""}
                </p>
                <p className="mt-2 text-sm">
                  Seats {b.seats.map((s) => s.code).join(", ")} · {b.status.replaceAll("_", " ")}
                </p>
                <p className="text-sm">
                  {b.remainingAmount > 0 ? "50% " : "Paid "}
                  {pkr(b.depositAmount)}
                  {b.remainingAmount > 0
                    ? ` · remaining ${pkr(b.remainingAmount)}${b.remainingPaidAt ? " (paid)" : " (due 1 day before)"}`
                    : ""}{" "}
                  · {b.paymentMethod} · booked {formatDateTime(b.bookedAt, locale)}
                </p>
                {b.payments.length ? (
                  <p className="mt-1 text-xs text-ink/55">
                    Payments: {b.payments.map((p) => `${p.kind.toLowerCase()} ${p.status.toLowerCase()} ${pkr(p.amount)}`).join(" · ")}
                  </p>
                ) : null}
              </div>
            ))}
            {!trip.bookings.length ? (
              <p className="text-ink/60">No bookings yet. Seats lock here after the traveler’s payment is confirmed.</p>
            ) : null}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
