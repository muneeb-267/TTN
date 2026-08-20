import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocale } from "@/lib/i18n";
import { PageShell } from "@/components/shell";
import { inputClass } from "@/components/fields";
import { addAgencyMedia } from "@/app/actions/trips";
import { removeAgencyMedia, updateAgencyProfile } from "@/app/actions/profile";
import { agencyAvatar, isProfilePost } from "@/lib/media";

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

        <form action={updateAgencyProfile} className="card mt-8 grid gap-4 rounded-3xl p-5 sm:grid-cols-[8rem_1fr]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={agencyAvatar(agency)} alt="" className="ig-avatar mx-auto" />
          <div className="space-y-3">
            <label className="block text-sm font-medium">
              Profile picture
              <input name="avatar" type="file" accept="image/*" className={`${inputClass} mt-1`} />
            </label>
            <label className="block text-sm font-medium">
              About previous trips
              <textarea
                name="about"
                required
                rows={5}
                className={`${inputClass} mt-1`}
                defaultValue={agency.about}
                placeholder="Where you have taken groups, the fleet, hotels you use…"
              />
            </label>
            <button className="btn-pine rounded-full px-4 py-2">Save profile</button>
          </div>
        </form>

        <h2 className="display mt-12 text-3xl">Posts</h2>
        <p className="mt-2 mb-4 text-sm text-ink/60">Photos and videos from the road. Keep them real.</p>
        <form action={addAgencyMedia} className="card mb-8 grid gap-3 rounded-3xl p-5 sm:grid-cols-2">
          <input name="photos" type="file" accept="image/*" multiple className={inputClass} />
          <input name="videos" type="file" accept="video/*" multiple className={inputClass} />
          <input name="caption" className={`${inputClass} sm:col-span-2`} placeholder="Caption" />
          <button className="btn-pine rounded-full px-4 py-2 sm:col-span-2">Upload post</button>
        </form>
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
