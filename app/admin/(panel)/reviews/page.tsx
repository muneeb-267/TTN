import { prisma } from "@/lib/prisma";
import { moderateReview } from "@/app/actions/admin";

export default async function AdminReviewsPage() {
  const reviews = await prisma.tripReview.findMany({
    include: { traveler: true, agency: true, trip: true, booking: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="display text-4xl">Reviews</h1>
      <div className="mt-6 grid gap-3">
        {reviews.map((r) => (
          <div key={r.id} className="card rounded-3xl p-5">
            <p className="font-semibold">
              {r.traveler.name} · {r.agency.businessName} · {"★".repeat(r.rating)}{" "}
              <span className="text-[10px] tracking-wide text-moss">Verified Booking {r.booking.publicRef}</span>
            </p>
            <p className="mt-2 text-sm">{r.body}</p>
            <form action={moderateReview.bind(null, r.id)} className="mt-3">
              <button name="decision" value="remove" className="text-sm text-red-800">
                Remove review
              </button>
            </form>
          </div>
        ))}
        {!reviews.length ? <p className="text-sm text-ink/60">No reviews yet.</p> : null}
      </div>
    </div>
  );
}
