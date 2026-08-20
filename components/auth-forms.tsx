"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signupTraveler } from "@/app/actions/auth";
import { Field, inputClass } from "@/components/fields";

export function LoginForm({
  role,
}: {
  role: "TRAVELER" | "AGENCY" | "ADMIN";
}) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await login(formData);
      return result?.error || null;
    },
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="role" value={role} />
      <Field label="Email or username">
        <input name="email" type="text" autoComplete="username" required className={inputClass} />
      </Field>
      <Field label="Password">
        <input name="password" type="password" required className={inputClass} autoComplete="current-password" />
      </Field>
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-pine w-full rounded-full px-5 py-3 font-semibold">
        {pending ? "Signing in…" : role === "ADMIN" ? "Open admin portal" : "Sign in"}
      </button>
      {role !== "ADMIN" ? (
        <p className="text-center text-sm text-ink/55">
          Forgot password?{" "}
          <Link href="/support" className="text-link underline">
            Email TTN support
          </Link>
        </p>
      ) : null}
    </form>
  );
}

export function TravelerSignupForm() {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await signupTraveler(formData);
      return result?.error || null;
    },
    null,
  );
  return (
    <form action={action} className="space-y-4">
      <Field label="Full name">
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
      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-gold w-full rounded-full px-5 py-3 font-semibold">
        {pending ? "Creating…" : "Create traveler account"}
      </button>
    </form>
  );
}
