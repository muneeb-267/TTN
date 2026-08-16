import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";

export default async function TravelerHome() {
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") redirect("/traveler/login");
  const locale = await getLocale();
  const bookings = await prisma.booking.findMany({
    where: { travelerId: session.id },
    include: { trip: true, seats: true },
    orderBy: { bookedAt: "desc" },
    take: 5,
  });
  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="display text-5xl">Salaam, {session.name.split(" ")[0]}</h1>
        <p className="mt-3 text-ink/70">Your northbound seats, deposits and remaining payments.</p>
        <div className="mt-8 flex gap-3">
          <Link href="/trips" className="rounded-full bg-gold px-5 py-2.5 font-semibold text-ink">
            Find a trip
          </Link>
          <Link href="/traveler/bookings" className="rounded-full border border-ink/15 px-5 py-2.5">
            All bookings
          </Link>
        </div>
        <div className="mt-10 grid gap-4">
          {bookings.map((b) => (
            <Link key={b.id} href={`/traveler/bookings/${b.id}`} className="card rounded-3xl p-5">
              <p className="text-xs text-ink/50">{b.publicRef}</p>
              <h2 className="display text-2xl">{b.trip.title}</h2>
              <p className="text-sm text-ink/70">
                Seats {b.seats.map((s) => s.code).join(", ")} · {b.status.replaceAll("_", " ")} ·{" "}
                {pkr(b.depositAmount)} paid
              </p>
              <p className="text-sm">{formatDateTime(b.trip.departureAt, locale)}</p>
            </Link>
          ))}
          {!bookings.length ? <p className="text-ink/60">No bookings yet. Pick a cinema seat on a trip.</p> : null}
        </div>
      </div>
    </PageShell>
  );
}
