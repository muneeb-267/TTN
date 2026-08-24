import { prisma } from "@/lib/prisma";
import { pkr } from "@/lib/format";

export default async function AdminAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<{ range?: string }>;
}) {
  const { range = "30" } = await searchParams;
  const days = range === "today" ? 1 : range === "year" ? 365 : Number(range) || 30;
  const from = new Date();
  from.setDate(from.getDate() - days);
  const bookings = await prisma.booking.findMany({
    where: { bookedAt: { gte: from } },
    include: { trip: true, payments: true },
  });
  const paid = bookings.filter((b) => ["DEPOSIT_PAID", "FULLY_PAID", "COMPLETED"].includes(b.status));
  const failed = bookings.flatMap((b) => b.payments).filter((p) => p.status === "FAILED").length;
  const success = bookings.flatMap((b) => b.payments).filter((p) => p.status === "CONFIRMED").length;
  const dest = new Map<string, number>();
  const cities = new Map<string, number>();
  for (const b of paid) {
    dest.set(b.trip.toDestination, (dest.get(b.trip.toDestination) || 0) + 1);
    cities.set(b.trip.fromCity, (cities.get(b.trip.fromCity) || 0) + 1);
  }
  const gmv = paid.reduce((s, b) => s + b.totalPrice, 0);
  const cancelled = bookings.filter((b) => b.status.startsWith("CANCEL")).length;

  return (
    <div>
      <h1 className="display text-4xl">Analytics</h1>
      <form className="mt-4 flex flex-wrap gap-2">
        {["today", "7", "30", "90", "year"].map((r) => (
          <button key={r} name="range" value={r} className={`rounded-full px-3 py-1.5 text-sm ${range === r ? "btn-pine" : "border"}`}>
            {r === "today" ? "Today" : r === "year" ? "This year" : `${r} days`}
          </button>
        ))}
      </form>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Box label="Bookings" value={String(bookings.length)} />
        <Box label="GMV" value={pkr(gmv)} />
        <Box label="Commission" value={pkr(paid.reduce((s, b) => s + b.platformFee, 0))} />
        <Box label="Cancel rate" value={bookings.length ? `${Math.round((cancelled / bookings.length) * 100)}%` : "0%"} />
        <Box label="Payments OK / failed" value={`${success} / ${failed}`} />
        <Box label="Avg booking" value={paid.length ? pkr(Math.round(gmv / paid.length)) : pkr(0)} />
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <List title="Popular destinations" rows={[...dest.entries()].sort((a, b) => b[1] - a[1])} />
        <List title="Top departure cities" rows={[...cities.entries()].sort((a, b) => b[1] - a[1])} />
      </div>
    </div>
  );
}

function Box({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-3xl p-5">
      <p className="text-xs tracking-widest text-moss">{label}</p>
      <p className="display mt-2 text-3xl">{value}</p>
    </div>
  );
}

function List({ title, rows }: { title: string; rows: [string, number][] }) {
  return (
    <div className="card rounded-3xl p-5">
      <h2 className="display text-2xl">{title}</h2>
      <ul className="mt-3 space-y-1 text-sm">
        {rows.slice(0, 8).map(([k, v]) => (
          <li key={k} className="flex justify-between">
            <span>{k}</span>
            <span>{v}</span>
          </li>
        ))}
        {!rows.length ? <li className="text-ink/50">No data in this range.</li> : null}
      </ul>
    </div>
  );
}
