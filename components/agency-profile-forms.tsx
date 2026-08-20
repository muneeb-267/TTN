"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateAgencyProfile } from "@/app/actions/profile";
import { addAgencyMedia } from "@/app/actions/trips";
import { inputClass } from "@/components/fields";

export function AgencyProfileForm({
  about,
  avatarUrl,
}: {
  about: string;
  avatarUrl: string;
}) {
  const router = useRouter();
  const [preview, setPreview] = useState(avatarUrl);
  const [state, action, pending] = useActionState(
    async (_: { error?: string; ok?: boolean } | null, formData: FormData) => {
      return updateAgencyProfile(formData);
    },
    null,
  );

  useEffect(() => {
    setPreview(avatarUrl);
  }, [avatarUrl]);

  useEffect(() => {
    if (state?.ok) router.refresh();
  }, [state, router]);

  return (
    <form action={action} encType="multipart/form-data" className="card mt-8 grid gap-4 rounded-3xl p-5 sm:grid-cols-[8rem_1fr]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={preview} alt="" className="ig-avatar mx-auto object-cover" />
      <div className="space-y-3">
        <label className="block text-sm font-medium">
          Profile picture
          <input
            name="avatar"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className={`${inputClass} mt-1`}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) {
                setPreview(avatarUrl);
                return;
              }
              const url = URL.createObjectURL(file);
              setPreview(url);
            }}
          />
        </label>
        <p className="text-xs text-ink/55">JPG, PNG or WebP. Save profile after you pick a photo.</p>
        <label className="block text-sm font-medium">
          About previous trips
          <textarea
            name="about"
            rows={5}
            className={`${inputClass} mt-1`}
            defaultValue={about}
            placeholder="Where you have taken groups, the fleet, hotels you use…"
          />
        </label>
        {state?.error ? <p className="text-sm text-red-800">{state.error}</p> : null}
        {state?.ok ? <p className="text-sm text-moss">Profile saved.</p> : null}
        <button disabled={pending} className="btn-pine rounded-full px-4 py-2">
          {pending ? "Saving…" : "Save profile"}
        </button>
      </div>
    </form>
  );
}

export function AgencyPostsForm() {
  const [state, action, pending] = useActionState(
    async (_: { error?: string; ok?: boolean } | null, formData: FormData) => {
      return addAgencyMedia(formData);
    },
    null,
  );
  return (
    <form action={action} encType="multipart/form-data" className="card mb-8 grid gap-3 rounded-3xl p-5 sm:grid-cols-2">
      <input name="photos" type="file" accept="image/*" multiple className={inputClass} />
      <input name="videos" type="file" accept="video/*" multiple className={inputClass} />
      <input name="caption" className={`${inputClass} sm:col-span-2`} placeholder="Caption" />
      {state?.error ? <p className="text-sm text-red-800 sm:col-span-2">{state.error}</p> : null}
      {state?.ok ? <p className="text-sm text-moss sm:col-span-2">Post uploaded.</p> : null}
      <button disabled={pending} className="btn-pine rounded-full px-4 py-2 sm:col-span-2">
        {pending ? "Uploading…" : "Upload post"}
      </button>
    </form>
  );
}
