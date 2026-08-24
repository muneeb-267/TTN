import { prisma } from "@/lib/prisma";
import { resolveDispute } from "@/app/actions/admin";

export default async function AdminDisputesPage() {
  const disputes = await prisma.dispute.findMany({
    include: { reporter: true, agency: true, trip: true, booking: true },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  return (
    <div>
      <h1 className="display text-4xl">Disputes</h1>
      <div className="mt-6 grid gap-3">
        {disputes.map((d) => (
          <div key={d.id} className="card rounded-3xl p-5">
            <p className="font-semibold">
              {d.kind} · {d.status} · {d.reporter.name}
            </p>
            <p className="mt-2 text-sm">{d.body}</p>
            <form action={resolveDispute.bind(null, d.id)} className="mt-3 flex flex-wrap gap-2">
              <input name="resolution" placeholder="Resolution note" className="rounded-full border px-3 py-1.5 text-sm" />
              <button name="status" value="RESOLVED" className="btn-pine rounded-full px-3 py-1.5 text-sm">
                Resolve
              </button>
              <button name="status" value="REJECTED" className="rounded-full border px-3 py-1.5 text-sm">
                Reject
              </button>
            </form>
          </div>
        ))}
        {!disputes.length ? <p className="text-sm text-ink/60">No disputes.</p> : null}
      </div>
    </div>
  );
}
