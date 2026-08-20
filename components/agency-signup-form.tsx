"use client";

import { useActionState, useState } from "react";
import { signupAgency } from "@/app/actions/auth";
import { CITIES, MIN_CLIENT_PHONES, MIN_CNIC_PHOTOS, MIN_PREVIOUS_PHOTOS, MIN_WHATSAPP_REVIEWS } from "@/lib/constants";
import { Field, inputClass } from "@/components/fields";

export function AgencySignupForm() {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await signupAgency(formData);
      return result?.error || null;
    },
    null,
  );
  const [phones, setPhones] = useState<string[]>(Array.from({ length: MIN_CLIENT_PHONES }, () => ""));

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
            <input name="password" type="password" minLength={8} required className={inputClass} />
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
        <h2 className="display text-2xl">CNIC of two people (mandatory)</h2>
        <p className="text-sm text-ink/70">
          Upload clear pictures of two people&apos;s CNIC cards. TTN uses this to verify the agency.
        </p>
        <Field label={`CNIC photos (${MIN_CNIC_PHOTOS} required)`}>
          <input name="cnicPhotos" type="file" accept="image/*" multiple required className={inputClass} />
        </Field>
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">WhatsApp review pictures</h2>
        <p className="text-sm text-ink/70">
          Upload at least {MIN_WHATSAPP_REVIEWS} screenshots of real client reviews from WhatsApp.
          Typed reviews are not accepted.
        </p>
        <Field label="WhatsApp screenshots">
          <input
            name="whatsappReviews"
            type="file"
            accept="image/*"
            multiple
            required
            className={inputClass}
          />
        </Field>
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Client phone numbers for confirmation</h2>
        <p className="text-sm text-ink/70">
          At least {MIN_CLIENT_PHONES} numbers of clients who left those WhatsApp reviews, so TTN
          can call and confirm they are real.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          {phones.map((phone, i) => (
            <input
              key={i}
              name="clientPhone"
              className={inputClass}
              placeholder={`Client phone ${i + 1}`}
              value={phone}
              onChange={(e) =>
                setPhones((cur) => cur.map((p, idx) => (idx === i ? e.target.value : p)))
              }
              required
            />
          ))}
        </div>
        <button
          type="button"
          className="text-link text-sm"
          onClick={() => setPhones((cur) => [...cur, ""])}
        >
          + Add another number
        </button>
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Real footage from previous trips</h2>
        <p className="text-sm text-ink/70">
          At least {MIN_PREVIOUS_PHOTOS} original photos. No AI-generated images.
        </p>
        <Field label="Photos">
          <input name="photos" type="file" accept="image/*" multiple required className={inputClass} />
        </Field>
        <Field label="Videos (optional)">
          <input name="videos" type="file" accept="video/*" multiple className={inputClass} />
        </Field>
        <label className="flex items-start gap-3 text-sm">
          <input name="realMedia" type="checkbox" required className="mt-1" />
          I confirm these photos, videos, WhatsApp reviews and CNICs are real, not AI generated.
        </label>
      </section>

      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="btn-pine w-full rounded-full px-5 py-3 font-semibold disabled:opacity-40"
      >
        {pending ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
