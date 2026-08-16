import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n";
import { pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { reviewAgency } from "@/app/actions/admin";

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin/login");
  const locale = await getLocale();
  const agencies = await prisma.agency.findMany({
    include: {
      user: true,
      signupReviews: true,
      media: true,
      reviews: true,
    },
    orderBy: { createdAt: "desc" },
  });
  const paid = await prisma.booking.findMany({
    where: { status: { in: ["FULLY_PAID", "COMPLETED"] } },
  });
  const cancelFees = await prisma.refundRequest.findMany({
    where: { status: "APPROVED", sameDay: false },
  });
  const commission = paid.reduce((s, b) => s + b.platformFee, 0);
  const cancelIncome = cancelFees.reduce((s, r) => s + r.platformKeep, 0);

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="display text-5xl">TTN control</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <Stat label="5% seat commission" value={pkr(commission)} />
          <Stat label="Late-cancel keep (30% of half)" value={pkr(cancelIncome)} />
          <Stat label="Platform total" value={pkr(commission + cancelIncome)} />
        </div>
        <h2 className="display mt-12 text-3xl">Agencies</h2>
        <div className="mt-4 grid gap-4">
          {agencies.map((a) => (
            <div key={a.id} className="card rounded-3xl p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="display text-2xl">{a.businessName}</h3>
                  <p className="text-sm text-ink/70">
                    {a.user.email} · {a.city} · {a.status} · {a.signupReviews.length} signup reviews ·{" "}
                    {a.media.length} media files · {a.reviews.length} completed-trip reviews
                  </p>
                  <p className="mt-2 max-w-2xl text-sm">{a.about}</p>
                </div>
                {a.status === "PENDING" ? (
                  <form action={reviewAgency.bind(null, a.id)} className="flex gap-2">
                    <button name="decision" value="approve" className="rounded-full bg-pine px-4 py-2 text-sand">
                      Approve
                    </button>
                    <button name="decision" value="reject" className="rounded-full border px-4 py-2">
                      Reject
                    </button>
                  </form>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="card rounded-3xl p-5">
      <p className="text-xs tracking-widest text-moss">{label}</p>
      <p className="display mt-2 text-3xl">{value}</p>
    </div>
  );
}
