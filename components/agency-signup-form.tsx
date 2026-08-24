"use client";

import { useActionState, useRef, useState } from "react";
import { signupAgency } from "@/app/actions/auth";
import { CITIES, MIN_CLIENT_PHONES, MIN_CNIC_PHOTOS, MIN_PREVIOUS_PHOTOS, MIN_WHATSAPP_REVIEWS } from "@/lib/constants";
import { Field, inputClass } from "@/components/fields";

const STEPS = [
  { n: 1, label: "Basic information" },
  { n: 2, label: "Verification" },
  { n: 3, label: "Experience" },
  { n: 4, label: "Review" },
] as const;

function fileCount(list: FileList | null) {
  return list ? Array.from(list).filter((file) => file.size > 0).length : 0;
}

export function AgencySignupForm({
  oauthAccount,
}: {
  oauthAccount?: { name: string; email: string };
}) {
  const formRef = useRef<HTMLFormElement>(null);
  const [step, setStep] = useState(1);
  const [hint, setHint] = useState<string | null>(null);
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await signupAgency(formData);
      return result?.error || null;
    },
    null,
  );
  const [phones, setPhones] = useState<string[]>(Array.from({ length: MIN_CLIENT_PHONES }, () => ""));
  const [summary, setSummary] = useState({
    name: oauthAccount?.name || "",
    email: oauthAccount?.email || "",
    phone: "",
    businessName: "",
    city: "Lahore",
    operatingCities: "",
    about: "",
    cnic: 0,
    whatsapp: 0,
    photos: 0,
    videos: 0,
  });

  function readSummary() {
    const form = formRef.current;
    if (!form) return;
    const value = (name: string) => String(new FormData(form).get(name) || "").trim();
    setSummary({
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      businessName: value("businessName"),
      city: value("city") || "Lahore",
      operatingCities: value("operatingCities"),
      about: value("about"),
      cnic: fileCount((form.elements.namedItem("cnicPhotos") as HTMLInputElement | null)?.files || null),
      whatsapp: fileCount((form.elements.namedItem("whatsappReviews") as HTMLInputElement | null)?.files || null),
      photos: fileCount((form.elements.namedItem("photos") as HTMLInputElement | null)?.files || null),
      videos: fileCount((form.elements.namedItem("videos") as HTMLInputElement | null)?.files || null),
    });
  }

  function validateStep(current: number) {
    const form = formRef.current;
    if (!form) return false;
    const fields = form.querySelectorAll<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>(
      `[data-step="${current}"]`,
    );
    for (const field of fields) {
      if (!field.checkValidity()) {
        field.reportValidity();
        return false;
      }
    }
    if (current === 2) {
      const cnics = fileCount((form.elements.namedItem("cnicPhotos") as HTMLInputElement).files);
      const whatsapp = fileCount((form.elements.namedItem("whatsappReviews") as HTMLInputElement).files);
      if (cnics < MIN_CNIC_PHOTOS) {
        setHint(`Upload CNIC photos of ${MIN_CNIC_PHOTOS} people.`);
        return false;
      }
      if (whatsapp < MIN_WHATSAPP_REVIEWS) {
        setHint(`Upload at least ${MIN_WHATSAPP_REVIEWS} WhatsApp review screenshots.`);
        return false;
      }
    }
    if (current === 3) {
      const photos = fileCount((form.elements.namedItem("photos") as HTMLInputElement).files);
      const filledPhones = phones.filter((p) => p.trim().length >= 10);
      if (filledPhones.length < MIN_CLIENT_PHONES) {
        setHint(`Add at least ${MIN_CLIENT_PHONES} client phone numbers.`);
        return false;
      }
      if (photos < MIN_PREVIOUS_PHOTOS) {
        setHint(`Upload at least ${MIN_PREVIOUS_PHOTOS} original trip photos.`);
        return false;
      }
    }
    setHint(null);
    return true;
  }

  function goNext() {
    if (!validateStep(step)) return;
    if (step === 3) readSummary();
    setStep((n) => Math.min(4, n + 1));
  }

  return (
    <form ref={formRef} action={action} className="space-y-6">
      <ol className="agency-steps">
        {STEPS.map((item) => (
          <li key={item.n} className={step >= item.n ? "is-active" : ""}>
            <span>{item.n}</span>
            {item.label}
          </li>
        ))}
        <li className="is-later">
          <span>✓</span>
          Approved
        </li>
      </ol>
      <p className="text-center text-sm text-ink/60">
        Step {step} of 4. After you submit, TTN reviews the file. Typical review time: 1–2 working days.
      </p>

      <section className={step === 1 ? "card space-y-4 rounded-3xl p-5 sm:p-6" : "hidden"} aria-hidden={step !== 1}>
        <h2 className="display text-2xl">Step 1 — Business information</h2>
        <p className="text-sm text-ink/65">Who you are, and where you run trips from.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Your name">
            <input
              name="name"
              data-step="1"
              required
              className={inputClass}
              defaultValue={oauthAccount?.name}
            />
          </Field>
          <Field label="Email">
            <input
              name="email"
              type="email"
              data-step="1"
              required
              readOnly={Boolean(oauthAccount)}
              className={inputClass}
              defaultValue={oauthAccount?.email}
            />
          </Field>
          <Field label="Phone / WhatsApp">
            <input name="phone" data-step="1" required className={inputClass} />
          </Field>
          {oauthAccount ? (
            <p className="sm:col-span-2 text-sm text-ink/65">
              You already signed in with Google or Apple. A password is not required to finish this file.
            </p>
          ) : (
            <Field label="Password">
              <input name="password" type="password" minLength={8} data-step="1" required className={inputClass} />
            </Field>
          )}
          <Field label="Agency name">
            <input name="businessName" data-step="1" required className={inputClass} />
          </Field>
          <Field label="Home city">
            <select name="city" data-step="1" className={inputClass} defaultValue="Lahore">
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Other operating cities (optional)">
          <input
            name="operatingCities"
            data-step="1"
            className={inputClass}
            placeholder="Islamabad, Karachi…"
          />
        </Field>
        <Field label="About your trips">
          <textarea name="about" rows={4} data-step="1" className={inputClass} required />
        </Field>
      </section>

      <section className={step === 2 ? "card space-y-4 rounded-3xl p-5 sm:p-6" : "hidden"} aria-hidden={step !== 2}>
        <h2 className="display text-2xl">Step 2 — Verification</h2>
        <p className="text-sm text-ink/65">
          CNICs and WhatsApp reviews stay with TTN staff. They are not shown on your public page.
        </p>
        <Field label={`CNIC photos (${MIN_CNIC_PHOTOS} people, required)`}>
          <input name="cnicPhotos" data-step="2" type="file" accept="image/*" multiple required className={inputClass} />
        </Field>
        <Field label={`WhatsApp client review screenshots (${MIN_WHATSAPP_REVIEWS} required)`}>
          <input
            name="whatsappReviews"
            data-step="2"
            type="file"
            accept="image/*"
            multiple
            required
            className={inputClass}
          />
        </Field>
      </section>

      <section className={step === 3 ? "card space-y-4 rounded-3xl p-5 sm:p-6" : "hidden"} aria-hidden={step !== 3}>
        <h2 className="display text-2xl">Step 3 — Previous work</h2>
        <p className="text-sm text-ink/65">
          Original trip photos and client numbers TTN can call to confirm the WhatsApp reviews.
        </p>
        <p className="text-sm font-medium">Client phone numbers ({MIN_CLIENT_PHONES} required)</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {phones.map((phone, i) => (
            <input
              key={i}
              name="clientPhone"
              data-step="3"
              className={inputClass}
              placeholder={`Client phone ${i + 1}`}
              value={phone}
              minLength={10}
              required={i < MIN_CLIENT_PHONES}
              onChange={(e) => setPhones((cur) => cur.map((p, idx) => (idx === i ? e.target.value : p)))}
            />
          ))}
        </div>
        <button type="button" className="text-link text-sm" onClick={() => setPhones((cur) => [...cur, ""])}>
          + Add another number
        </button>
        <Field label={`Original trip photos (${MIN_PREVIOUS_PHOTOS} required)`}>
          <input name="photos" data-step="3" type="file" accept="image/*" multiple required className={inputClass} />
        </Field>
        <Field label="Videos (optional)">
          <input name="videos" type="file" accept="video/*" multiple className={inputClass} />
        </Field>
        <label className="flex items-start gap-3 text-sm">
          <input name="realMedia" data-step="3" type="checkbox" required className="mt-1" />
          I confirm these photos, videos, WhatsApp reviews and CNICs are real, not AI generated.
        </label>
      </section>

      <section className={step === 4 ? "card space-y-4 rounded-3xl p-5 sm:p-6" : "hidden"} aria-hidden={step !== 4}>
        <h2 className="display text-2xl">Step 4 — TTN review</h2>
        <p className="text-sm text-ink/65">
          Our team reviews your application. Typical review time: 1–2 working days. You can sign in meanwhile;
          posting trips unlocks after approval.
        </p>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-ink/50">Agency</dt>
            <dd className="font-medium">{summary.businessName || "—"}</dd>
          </div>
          <div>
            <dt className="text-ink/50">Contact</dt>
            <dd className="font-medium">
              {summary.name}
              <br />
              {summary.email}
              <br />
              {summary.phone}
            </dd>
          </div>
          <div>
            <dt className="text-ink/50">Cities</dt>
            <dd className="font-medium">
              {summary.city}
              {summary.operatingCities ? ` · ${summary.operatingCities}` : ""}
            </dd>
          </div>
          <div>
            <dt className="text-ink/50">Uploads</dt>
            <dd className="font-medium">
              {summary.cnic} CNIC · {summary.whatsapp} WhatsApp · {summary.photos} photos
              {summary.videos ? ` · ${summary.videos} videos` : ""}
            </dd>
          </div>
        </dl>
        {summary.about ? <p className="text-sm text-ink/75">{summary.about}</p> : null}
      </section>

      {hint || error ? <p className="text-sm text-red-800">{error || hint}</p> : null}

      <div className="flex flex-wrap gap-3">
        {step > 1 ? (
          <button type="button" className="nav-link border border-gold/40" onClick={() => setStep((n) => n - 1)}>
            Back
          </button>
        ) : null}
        {step < 4 ? (
          <button type="button" className="btn-pine rounded-full px-5 py-3 font-semibold" onClick={goNext}>
            Continue
          </button>
        ) : (
          <button
            type="submit"
            disabled={pending}
            className="btn-gold flex-1 rounded-full px-5 py-3 font-semibold disabled:opacity-40"
          >
            {pending ? "Submitting…" : "Submit for review"}
          </button>
        )}
      </div>
    </form>
  );
}
