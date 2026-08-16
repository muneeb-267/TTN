import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { formatDateTime, pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";

export default async function BookingsPage() {
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") redirect("/traveler/login");
  const locale = await getLocale();
  const bookings = await prisma.booking.findMany({
    where: { travelerId: session.id },
    include: { trip: true, seats: true },
    orderBy: { bookedAt: "desc" },
  });
  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="display text-5xl">My bookings</h1>
        <div className="mt-8 grid gap-4">
          {bookings.map((b) => (
            <Link key={b.id} href={`/traveler/bookings/${b.id}`} className="card card-hover rounded-3xl p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs tracking-widest text-moss">{b.publicRef}</p>
                  <h2 className="display text-3xl">{b.trip.title}</h2>
                  <p className="text-sm text-ink/70">
                    {b.trip.fromCity} → {b.trip.toDestination} · seats{" "}
                    {b.seats.map((s) => s.code).join(", ")}
                  </p>
                  <p className="text-sm">{formatDateTime(b.trip.departureAt, locale)}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{b.status.replaceAll("_", " ")}</p>
                  <p className="text-sm text-ink/60">{pkr(b.totalPrice)}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
