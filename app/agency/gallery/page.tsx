import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { inputClass } from "@/components/fields";
import { addAgencyMedia } from "@/app/actions/trips";

export default async function GalleryPage() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const locale = await getLocale();
  const agency = await prisma.agency.findUnique({
    where: { userId: session.id },
    include: { media: { orderBy: { id: "desc" } } },
  });
  if (!agency) redirect("/agency/signup");
  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="display text-5xl">Previous trips</h1>
        <p className="mt-3 mb-8 text-ink/70">Photos and videos from the road. Keep them real.</p>
        <form action={addAgencyMedia} className="card mb-8 grid gap-3 rounded-3xl p-5 sm:grid-cols-2">
          <input name="photos" type="file" accept="image/*" multiple className={inputClass} />
          <input name="videos" type="file" accept="video/*" multiple className={inputClass} />
          <input name="caption" className={`${inputClass} sm:col-span-2`} placeholder="Caption" />
          <button className="rounded-full bg-pine px-4 py-2 text-sand sm:col-span-2">Upload</button>
        </form>
        <div className="grid gap-4 sm:grid-cols-3">
          {agency.media.map((m) =>
            m.kind === "VIDEO" ? (
              <video key={m.id} src={m.url} controls className="h-48 w-full rounded-3xl object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={m.id} src={m.url} alt={m.caption} className="h-48 w-full rounded-3xl object-cover" />
            ),
          )}
        </div>
      </div>
    </PageShell>
  );
}
