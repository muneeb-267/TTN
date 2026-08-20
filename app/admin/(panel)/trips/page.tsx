import { prisma } from "@/lib/prisma";
import { pkr } from "@/lib/format";
import { moderateTrip } from "@/app/actions/admin";

export default async function AdminTripsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  const { status = "", q = "" } = await searchParams;
  const trips = await prisma.trip.findMany({
    where: {
      ...(q ? { OR: [{ title: { contains: q } }, { toDestination: { contains: q } }] } : {}),
      ...(status === "pending" ? { approvalStatus: "PENDING_APPROVAL" } : {}),
      ...(status === "published" ? { published: true } : {}),
      ...(status === "rejected" ? { approvalStatus: "REJECTED" } : {}),
      ...(status === "cancelled" ? { approvalStatus: "CANCELLED" } : {}),
    },
    include: { agency: true, seats: true, bookings: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="display text-4xl">Trips</h1>
      <form className="mt-6 flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Title or destination" className="rounded-full border px-4 py-2" />
        <select name="status" defaultValue={status} className="rounded-full border px-4 py-2">
          <option value="">All</option>
          <option value="pending">Pending approval</option>
          <option value="published">Published</option>
          <option value="rejected">Rejected</option>
        </select>
        <button className="btn-pine rounded-full px-4 py-2">Filter</button>
      </form>
      <div className="mt-6 grid gap-3">
        {trips.map((trip) => (
          <div key={trip.id} className="card rounded-3xl p-5">
            <p className="display text-2xl">{trip.title}</p>
            <p className="text-sm text-ink/70">
              {trip.agency.businessName} · {trip.fromCity} → {trip.toDestination} · {pkr(trip.pricePerSeat)} ·{" "}
              {trip.published ? "Published" : trip.approvalStatus}
            </p>
            <form action={moderateTrip.bind(null, trip.id)} className="mt-3 flex flex-wrap gap-2">
              <input name="reason" placeholder="Rejection / change note" className="rounded-full border px-3 py-1.5 text-sm" />
              <button name="decision" value="approve" className="btn-pine rounded-full px-3 py-1.5 text-sm">
                Approve
              </button>
              <button name="decision" value="reject" className="rounded-full border px-3 py-1.5 text-sm">
                Reject
              </button>
              <button name="decision" value="unpublish" className="rounded-full border px-3 py-1.5 text-sm">
                Unpublish
              </button>
            </form>
          </div>
        ))}
        {!trips.length ? <p className="text-sm text-ink/60">No trips match.</p> : null}
      </div>
    </div>
  );
}
