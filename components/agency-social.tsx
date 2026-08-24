"use client";

import { useActionState } from "react";
import { addAgencyComment, upsertAgencyReview } from "@/app/actions/profile";
import { inputClass } from "@/components/fields";

export function AgencyReviewForm({
  agencyId,
  existing,
}: {
  agencyId: string;
  existing?: { rating: number; body: string } | null;
}) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await upsertAgencyReview(agencyId, formData);
      return result?.error || null;
    },
    null,
  );
  return (
    <form action={action} className="card space-y-3 rounded-3xl p-5">
      <p className="text-sm font-medium">
        {existing ? "Update your review" : "Review this agency"}
      </p>
      <select name="rating" className={inputClass} defaultValue={String(existing?.rating || 5)}>
        <option value="5">★★★★★</option>
        <option value="4">★★★★</option>
        <option value="3">★★★</option>
        <option value="2">★★</option>
        <option value="1">★</option>
      </select>
      <textarea
        name="body"
        required
        rows={3}
        className={inputClass}
        placeholder="How were the previous trips, hotels, the coaster…?"
        defaultValue={existing?.body}
      />
      <input name="photos" type="file" accept="image/*" multiple className={inputClass} />
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-gold rounded-full px-4 py-2 font-semibold">
        {pending ? "Saving…" : existing ? "Save review" : "Post review"}
      </button>
    </form>
  );
}

export function AgencyCommentForm({ agencyId }: { agencyId: string }) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await addAgencyComment(agencyId, formData);
      return result?.error || null;
    },
    null,
  );
  return (
    <form action={action} className="mb-6 flex flex-col gap-3">
      <textarea
        name="body"
        required
        rows={2}
        className={inputClass}
        placeholder="Ask about past trips, the fleet, hotels…"
      />
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-pine self-start rounded-full px-4 py-2">
        {pending ? "Posting…" : "Post comment"}
      </button>
    </form>
  );
}
