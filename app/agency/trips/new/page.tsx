import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { TripForm } from "@/components/trip-form";

export default async function NewTripPage() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency || agency.status !== "APPROVED") redirect("/agency");
  const locale = await getLocale();
  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <h1 className="display text-5xl">Post a trip</h1>
        <p className="mb-8 mt-3 text-ink/70">
          Set from/to, dates, vehicle, then the number of seats. TTN generates the cinema map
          travelers tap.
        </p>
        <TripForm />
      </div>
    </PageShell>
  );
}
