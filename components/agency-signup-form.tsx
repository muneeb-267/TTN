"use client";

import { useActionState, useMemo, useState } from "react";
import { signupAgency } from "@/app/actions/auth";
import { CITIES, DESTINATIONS, MIN_PREVIOUS_PHOTOS, MIN_SIGNUP_REVIEWS } from "@/lib/constants";
import { Field, inputClass } from "@/components/fields";

type Review = {
  clientName: string;
  rating: number;
  comment: string;
  tripDestination: string;
};

const emptyReview = (): Review => ({
  clientName: "",
  rating: 5,
  comment: "",
  tripDestination: "Hunza",
});

export function AgencySignupForm() {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await signupAgency(formData);
      return result?.error || null;
    },
    null,
  );
  const [reviews, setReviews] = useState<Review[]>(
    Array.from({ length: MIN_SIGNUP_REVIEWS }, emptyReview),
  );

  const filled = useMemo(
    () => reviews.filter((r) => r.clientName.trim() && r.comment.trim()).length,
    [reviews],
  );

  return (
    <form action={action} className="space-y-8">
      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Account</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input name="name" required className={inputClass} />
          </Field>
          <Field label="Email">
            <input name="email" type="email" required className={inputClass} />
          </Field>
          <Field label="Phone / WhatsApp">
            <input name="phone" className={inputClass} />
          </Field>
          <Field label="Password">
            <input name="password" type="password" minLength={6} required className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Agency</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Agency name">
            <input name="businessName" required className={inputClass} />
          </Field>
          <Field label="City">
            <select name="city" className={inputClass} defaultValue="Lahore">
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="About your trips">
          <textarea name="about" rows={4} className={inputClass} required />
        </Field>
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Real footage from previous trips</h2>
        <p className="text-sm text-ink/70">
          At least {MIN_PREVIOUS_PHOTOS} original photos. No AI-generated images. An admin checks
          this before you can post trips.
        </p>
        <Field label="Photos">
          <input name="photos" type="file" accept="image/*" multiple required className={inputClass} />
        </Field>
        <Field label="Videos (optional)">
          <input name="videos" type="file" accept="video/*" multiple className={inputClass} />
        </Field>
        <label className="flex items-start gap-3 text-sm">
          <input name="realMedia" type="checkbox" required className="mt-1" />
          I confirm these photos and videos are real, from our previous trips, and not AI generated.
        </label>
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <div className="flex items-end justify-between gap-3">
          <h2 className="display text-2xl">20 real client reviews</h2>
          <span className="text-sm text-moss">{filled}/{MIN_SIGNUP_REVIEWS} filled</span>
        </div>
        <input type="hidden" name="reviews" value={JSON.stringify(reviews)} />
        <div className="grid gap-4">
          {reviews.map((review, i) => (
            <div key={i} className="rounded-2xl border border-ink/10 bg-white/70 p-4">
              <p className="mb-3 text-xs tracking-widest text-ink/50">REVIEW {i + 1}</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <input
                  className={inputClass}
                  placeholder="Client name"
                  value={review.clientName}
                  onChange={(e) =>
                    setReviews((cur) =>
                      cur.map((r, idx) => (idx === i ? { ...r, clientName: e.target.value } : r)),
                    )
                  }
                />
                <select
                  className={inputClass}
                  value={review.tripDestination}
                  onChange={(e) =>
                    setReviews((cur) =>
                      cur.map((r, idx) =>
                        idx === i ? { ...r, tripDestination: e.target.value } : r,
                      ),
                    )
                  }
                >
                  {DESTINATIONS.map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
                <select
                  className={inputClass}
                  value={review.rating}
                  onChange={(e) =>
                    setReviews((cur) =>
                      cur.map((r, idx) =>
                        idx === i ? { ...r, rating: Number(e.target.value) } : r,
                      ),
                    )
                  }
                >
                  {[5, 4, 3, 2, 1].map((n) => (
                    <option key={n} value={n}>
                      {n} stars
                    </option>
                  ))}
                </select>
              </div>
              <textarea
                className={`${inputClass} mt-3`}
                rows={2}
                placeholder="What did they say after the trip?"
                value={review.comment}
                onChange={(e) =>
                  setReviews((cur) =>
                    cur.map((r, idx) => (idx === i ? { ...r, comment: e.target.value } : r)),
                  )
                }
              />
            </div>
          ))}
        </div>
      </section>

      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button
        type="submit"
        disabled={pending || filled < MIN_SIGNUP_REVIEWS}
        className="w-full rounded-full bg-pine px-5 py-3 font-semibold text-sand disabled:opacity-40"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
