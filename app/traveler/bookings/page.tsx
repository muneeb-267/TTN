import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { PlaceHero, PlaceLinkCard } from "@/components/place-media";
import { SCENE } from "@/lib/destinations";
import { tripCoverImage } from "@/lib/media";

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
      <PlaceHero image={SCENE.naran} kicker="Traveler" title="My bookings" compact />
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-4">
          {bookings.map((b) => (
            <PlaceLinkCard
              key={b.id}
              href={`/traveler/bookings/${b.id}`}
              image={tripCoverImage(b.trip)}
              kicker={b.publicRef}
              title={b.trip.title}
              body={`${b.trip.fromCity} → ${b.trip.toDestination} · seats ${b.seats.map((s) => s.code).join(", ")} · ${b.status.replaceAll("_", " ")} · ${pkr(b.totalPrice)}`}
            />
          ))}
        </div>
      </div>
    </PageShell>
  );
}
