import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n";
import { pkr } from "@/lib/format";
import { PageShell } from "@/components/shell";
import { reviewAgency } from "@/app/actions/admin";
import { adminConfirmPayment, adminRejectPayment } from "@/app/actions/payments";

function phonesOf(raw: string) {
  try {
    const value = JSON.parse(raw) as string[];
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

export default async function AdminPage() {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") redirect("/admin/login");
  const locale = await getLocale();
  const agencies = await prisma.agency.findMany({
    include: {
      user: true,
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
  const refusalFines = await prisma.refundRequest.findMany({
    where: { agencyFine: { gt: 0 } },
  });
  const pendingPayments = await prisma.payment.findMany({
    where: { status: "PENDING" },
    include: { booking: { include: { traveler: true, trip: true } } },
    orderBy: { createdAt: "desc" },
  });
  const commission = paid.reduce((s, b) => s + b.platformFee, 0);
  const cancelIncome = cancelFees.reduce((s, r) => s + r.platformKeep, 0);
  const fineIncome = refusalFines.reduce((s, r) => s + r.agencyFine, 0);

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="display text-5xl">TTN control</h1>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="5% seat commission" value={pkr(commission)} />
          <Stat label="Late-cancel keep (15% of half)" value={pkr(cancelIncome)} />
          <Stat label="24h-refusal fines (1 seat)" value={pkr(fineIncome)} />
          <Stat label="Platform total" value={pkr(commission + cancelIncome + fineIncome)} />
        </div>
        <h2 className="display mt-12 text-3xl">Payments to match</h2>
        <div className="mt-4 grid gap-3">
          {pendingPayments.length === 0 ? (
            <p className="text-sm text-ink/60">No pending JazzCash, EasyPaisa or bank transfers.</p>
          ) : (
            pendingPayments.map((p) => (
              <div key={p.id} className="card rounded-3xl p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="text-sm">
                    <p className="display text-2xl">{p.booking.publicRef}</p>
                    <p>
                      {p.booking.traveler.name} · {p.method} · {p.kind.toLowerCase()} · {pkr(p.amount)}
                    </p>
                    <p className="text-ink/70">{p.booking.trip.title}</p>
                    {p.payerAccount ? <p>From {p.payerAccount}</p> : null}
                    {p.providerTxn ? <p>TID / RR {p.providerTxn}</p> : <p>No TID submitted yet</p>}
                    {p.receiptUrl ? (
                      <a href={p.receiptUrl} className="text-link" target="_blank" rel="noreferrer">
                        Receipt screenshot
                      </a>
                    ) : null}
                  </div>
                  <div className="flex gap-2">
                    <form action={adminConfirmPayment.bind(null, p.id)}>
                      <button className="btn-pine rounded-full px-4 py-2">Confirm received</button>
                    </form>
                    <form action={adminRejectPayment.bind(null, p.id)}>
                      <input type="hidden" name="note" value="Could not match this transfer." />
                      <button className="rounded-full border px-4 py-2 transition hover:border-gold hover:bg-sand">
                        Reject
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
        <h2 className="display mt-12 text-3xl">Agencies</h2>
        <div className="mt-4 grid gap-4">
          {agencies.map((a) => {
            const whatsapp = a.media.filter((m) => m.kind === "WHATSAPP");
            const cnics = a.media.filter((m) => m.kind === "CNIC");
            const phones = phonesOf(a.clientPhones);
            return (
              <div key={a.id} className="card rounded-3xl p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <h3 className="display text-2xl">{a.businessName}</h3>
                    <p className="text-sm text-ink/70">
                      {a.user.email} · {a.city} · {a.status} · {whatsapp.length} WhatsApp reviews ·{" "}
                      {cnics.length} CNICs · {phones.length} client phones · {a.reviews.length}{" "}
                      completed-trip reviews
                    </p>
                    {phones.length ? (
                      <p className="mt-1 text-sm">Confirm with: {phones.join(" · ")}</p>
                    ) : null}
                    <p className="mt-2 max-w-2xl text-sm">{a.about}</p>
                    <div className="mt-3 space-y-2">
                      {cnics.length ? (
                        <div>
                          <p className="text-xs tracking-widest text-moss">CNIC (mandatory)</p>
                          <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {cnics.map((m) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={m.id} src={m.url} alt={m.caption} className="h-24 w-full rounded-xl object-cover" />
                            ))}
                          </div>
                        </div>
                      ) : null}
                      {whatsapp.length ? (
                        <div>
                          <p className="text-xs tracking-widest text-moss">WhatsApp review screenshots</p>
                          <div className="mt-1 grid grid-cols-3 gap-2 sm:grid-cols-6">
                            {whatsapp.slice(0, 12).map((m) => (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img key={m.id} src={m.url} alt={m.caption} className="h-20 w-full rounded-xl object-cover" />
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                  {a.status === "PENDING" ? (
                    <form action={reviewAgency.bind(null, a.id)} className="flex gap-2">
                      <button name="decision" value="approve" className="btn-pine rounded-full px-4 py-2">
                        Approve
                      </button>
                      <button name="decision" value="reject" className="rounded-full border px-4 py-2 transition hover:border-gold hover:bg-sand">
                        Reject
                      </button>
                    </form>
                  ) : null}
                </div>
              </div>
            );
          })}
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
