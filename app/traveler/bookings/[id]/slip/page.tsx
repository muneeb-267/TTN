import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatDate, formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { PrintButton } from "@/components/print-button";

export default async function PaymentSlipPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") redirect("/traveler/login");
  const locale = await getLocale();
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      trip: { include: { agency: true } },
      seats: true,
      payments: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!booking || booking.travelerId !== session.id) notFound();
  const deposit = booking.payments.find((p) => p.kind === "DEPOSIT" || p.kind === "FULL");
  const remaining = booking.payments.find((p) => p.kind === "REMAINING");
  const half = booking.remainingAmount > 0 || Boolean(remaining);

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-2xl px-4 py-10">
        <p className="text-xs tracking-widest text-moss">
          PAYMENT SLIP · {half ? "50%" : "FULL"}
        </p>
        <h1 className="display text-4xl">{half ? "Deposit receipt" : "Payment receipt"}</h1>
        <div className="slip mt-6 space-y-3 rounded-3xl p-6 text-sm">
          <p className="display text-3xl">TTN</p>
          <p>Ref {booking.publicRef}</p>
          <p>
            Traveler: {session.name} · {session.email}
          </p>
          <p>
            Trip: {booking.trip.title} · {booking.trip.agency.businessName}
          </p>
          <p>
            {booking.trip.fromCity} → {booking.trip.toDestination}
          </p>
          <p>Departure {formatDateTime(booking.trip.departureAt, locale)}</p>
          <p>Seats {booking.seats.map((s) => s.code).join(", ")}</p>
          <hr className="border-gold/40" />
          <p>Full fare {pkr(booking.totalPrice)}</p>
          <p className="text-lg font-semibold">
            {half ? "50% paid now" : "Paid in full"} {pkr(booking.depositAmount)}
          </p>
          {half ? (
            <p>
              Remaining {pkr(booking.remainingAmount)} due {formatDate(booking.remainingDueAt, locale)}{" "}
              (one day before the trip)
            </p>
          ) : null}
          {remaining ? (
            <p className="font-semibold">
              Remaining 50% paid {pkr(remaining.amount)} · {formatDateTime(remaining.createdAt, locale)}
            </p>
          ) : null}
          <p>
            Method {deposit?.method || booking.paymentMethod} ·{" "}
            {deposit ? formatDateTime(deposit.createdAt, locale) : formatDateTime(booking.depositPaidAt, locale)}
          </p>
          <p className="text-ink/60">
            {half
              ? "Seat is confirmed against this 50% slip. Pay the rest one day before departure."
              : "Seat is confirmed against this payment slip."}
          </p>
        </div>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={`/traveler/bookings/${booking.id}`} className="btn-pine rounded-full px-5 py-2.5">
            Booking details
          </Link>
          <PrintButton />
        </div>
      </div>
    </PageShell>
  );
}
