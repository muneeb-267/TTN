import { prisma } from "@/lib/prisma";
import { pkr } from "@/lib/format";
import { formatBps } from "@/lib/money";
import { getFinanceRates, agencyFeeLedger, enforceAgencyFeeStatus } from "@/lib/platform-fees";
import { reviewAgency, suspendAgency, unsuspendAgency } from "@/app/actions/admin";

function phonesOf(raw: string) {
  try {
    const value = JSON.parse(raw) as string[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default async function AdminAgenciesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const { q = "", status = "", page = "1" } = await searchParams;
  const take = 20;
  const skip = (Math.max(1, Number(page) || 1) - 1) * take;
  const rates = await getFinanceRates();
  const where = {
    ...(q
      ? {
          OR: [
            { businessName: { contains: q } },
            { city: { contains: q } },
            { user: { email: { contains: q } } },
          ],
        }
      : {}),
    ...(status ? { status } : {}),
  };
  const [total, agencies] = await Promise.all([
    prisma.agency.count({ where }),
    prisma.agency.findMany({
      where,
      include: { user: true, media: true, reviews: true, trips: true },
      orderBy: { createdAt: "desc" },
      skip,
      take,
    }),
  ]);
  await Promise.all(agencies.map((a) => enforceAgencyFeeStatus(a.id)));
  const ledgers = Object.fromEntries(
    await Promise.all(agencies.map(async (a) => [a.id, await agencyFeeLedger(a.id)] as const)),
  );

  return (
    <div>
      <h1 className="display text-4xl">Agencies</h1>
      <form className="mt-6 flex flex-wrap gap-2" action="/admin/agencies">
        <input name="q" defaultValue={q} placeholder="Search agency or email" className="rounded-full border px-4 py-2" />
        <select name="status" defaultValue={status} className="rounded-full border px-4 py-2">
          <option value="">All statuses</option>
          <option value="PENDING">Pending review</option>
          <option value="APPROVED">Verified</option>
          <option value="REJECTED">Rejected</option>
          <option value="DELISTED">Suspended / delisted</option>
        </select>
        <button className="btn-pine rounded-full px-4 py-2">Filter</button>
      </form>
      <p className="mt-3 text-sm text-ink/55">
        {total} agencies · page {page}
      </p>
      <div className="mt-6 grid gap-4">
        {agencies.map((a) => {
          const whatsapp = a.media.filter((m) => m.kind === "WHATSAPP");
          const cnics = a.media.filter((m) => m.kind === "CNIC");
          const phones = phonesOf(a.clientPhones);
          const fees = ledgers[a.id];
          const rating = a.reviews.length ? a.reviews.reduce((s, r) => s + r.rating, 0) / a.reviews.length : 0;
          return (
            <div key={a.id} className="card rounded-3xl p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <h3 className="display text-2xl">{a.businessName}</h3>
                  <p className="text-sm text-ink/70">
                    {a.user.email} · {a.city} · {a.status} · {a.trips.length} trips · {rating ? `⭐ ${rating.toFixed(1)}` : "no rating"} ·{" "}
                    {a.createdAt.toISOString().slice(0, 10)}
                  </p>
                  {fees ? (
                    <p className="mt-1 text-sm">
                      Fee due {pkr(fees.outstanding)} · {formatBps(rates.commissionBps)} of listed fares
                      {fees.diverting ? " · traveler checkout on TTN accounts" : ""}
                    </p>
                  ) : null}
                  {phones.length ? <p className="mt-1 text-sm">Confirm with: {phones.join(" · ")}</p> : null}
                  <p className="mt-2 max-w-2xl text-sm">{a.about}</p>
                  {cnics.length ? (
                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                      {cnics.map((m) => (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img key={m.id} src={m.url} alt="CNIC on file" className="h-24 w-full rounded-xl object-cover" />
                      ))}
                    </div>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {a.status === "PENDING" ? (
                    <form action={reviewAgency.bind(null, a.id)} className="flex gap-2">
                      <button name="decision" value="approve" className="btn-pine rounded-full px-4 py-2">
                        Verify
                      </button>
                      <button name="decision" value="reject" className="rounded-full border px-4 py-2">
                        Reject
                      </button>
                    </form>
                  ) : null}
                  {a.status === "APPROVED" ? (
                    <form action={suspendAgency.bind(null, a.id)}>
                      <button className="rounded-full border px-4 py-2">Suspend</button>
                    </form>
                  ) : null}
                  {a.status === "DELISTED" || a.status === "REJECTED" ? (
                    <form action={unsuspendAgency.bind(null, a.id)}>
                      <button className="btn-pine rounded-full px-4 py-2">Reactivate</button>
                    </form>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
