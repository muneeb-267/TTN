import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getLocale } from "@/lib/i18n";
import { listNotifications } from "@/lib/notifications";
import { PageShell } from "@/components/shell";
import { markNotificationRead } from "@/app/actions/notifications";

export default async function InboxPage() {
  const session = await getSession();
  if (!session) redirect("/");
  const locale = await getLocale();
  const notes = await listNotifications(session.id);
  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="display text-5xl">Alerts</h1>
        <p className="mt-3 mb-8 text-ink/70">
          Deposit slips, remaining payments due one day before the trip, and new seat bookings.
        </p>
        <div className="space-y-3">
          {notes.map((n) => (
            <form key={n.id} action={markNotificationRead.bind(null, n.id)}>
              <Link
                href={n.href || "/inbox"}
                className={`card card-hover block rounded-3xl p-5 ${n.read ? "opacity-70" : ""}`}
              >
                <p className="text-xs tracking-widest text-moss">{n.read ? "READ" : "NEW"}</p>
                <h2 className="display text-2xl">{n.title}</h2>
                <p className="mt-1 text-sm text-ink/70">{n.body}</p>
              </Link>
              {!n.read ? (
                <button className="mt-2 text-xs text-moss hover:text-gold" type="submit">
                  Mark read
                </button>
              ) : null}
            </form>
          ))}
          {!notes.length ? <p className="text-ink/60">No alerts yet.</p> : null}
        </div>
      </div>
    </PageShell>
  );
}
