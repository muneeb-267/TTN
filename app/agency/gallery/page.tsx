import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { removeAgencyMedia } from "@/app/actions/profile";
import { agencyAvatar, isProfilePost } from "@/lib/media";
import { AgencyPostsForm, AgencyProfileForm } from "@/components/agency-profile-forms";

export default async function AgencyProfileEditorPage() {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") redirect("/agency/login");
  const locale = await getLocale();
  const agency = await prisma.agency.findUnique({
    where: { userId: session.id },
    include: { media: { orderBy: { id: "desc" } } },
  });
  if (!agency) redirect("/agency/signup");
  const posts = agency.media.filter(isProfilePost);

  return (
    <PageShell locale={locale} user={session}>
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="display text-5xl">Agency profile</h1>
            <p className="mt-3 text-ink/70">
              This is what travelers see — about your previous trips, photos, videos, reviews and
              comments.
            </p>
          </div>
          <Link href={`/agencies/${agency.id}`} className="btn-gold rounded-full px-5 py-2.5 font-semibold">
            View public profile
          </Link>
        </div>

        <AgencyProfileForm about={agency.about} avatarUrl={agencyAvatar(agency)} />

        <h2 className="display mt-12 text-3xl">Posts</h2>
        <p className="mt-2 mb-4 text-sm text-ink/60">Photos and videos from the road. Keep them real.</p>
        <AgencyPostsForm />
        <div className="ig-grid">
          {posts.map((m) => (
            <div key={m.id} className="ig-cell">
              {m.kind === "VIDEO" ? (
                <video src={m.url} controls playsInline />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={m.url} alt={m.caption} />
              )}
              <form action={removeAgencyMedia.bind(null, m.id)} className="ig-remove">
                <button className="w-full bg-pine/90 py-1.5 text-xs font-semibold text-sand">Remove</button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </PageShell>
  );
}
