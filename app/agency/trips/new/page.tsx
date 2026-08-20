import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale, t } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { TripForm } from "@/components/trip-form";

export default async function NewTripPage() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency || agency.status !== "APPROVED") redirect("/agency");
  const locale = await getLocale();
  const copy = t(locale);
  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-3xl px-4 py-10">
        <Link href="/agency/trips" className="text-link text-sm">
          ← {copy.backToPosted}
        </Link>
        <h1 className="display mt-3 text-5xl">Post a trip</h1>
        <p className="mb-8 mt-3 text-ink/70">
          Set from/to, dates, vehicle, seats, hotels, meals, deposit %, cancellation notes, and the
          bank account travelers should pay. JazzCash and EasyPaisa are optional extras.
        </p>
        <TripForm
          defaults={{
            jazzcashName: agency.jazzcashName,
            jazzcashNumber: agency.jazzcashNumber,
            easypaisaName: agency.easypaisaName,
            easypaisaNumber: agency.easypaisaNumber,
            bankName: agency.bankName,
            bankTitle: agency.bankTitle,
            bankIban: agency.bankIban,
            bankAccount: agency.bankAccount,
          }}
        />
      </div>
    </PageShell>
  );
}
