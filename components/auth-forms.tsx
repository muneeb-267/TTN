"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login, signupTraveler } from "@/app/actions/auth";
import { Field, inputClass } from "@/components/fields";
import { oauthErrorCopy } from "@/lib/oauth-shared";

export function OAuthError({ code }: { code?: string }) {
  if (!code) return null;
  return <p className="text-sm text-red-800">{oauthErrorCopy(code)}</p>;
}

export function SocialLogin({
  role,
  from = "login",
}: {
  role: "TRAVELER" | "AGENCY";
  from?: "login" | "signup";
}) {
  const googleHref = `/api/auth/google?role=${role}&from=${from}`;
  const appleHref = `/api/auth/apple?role=${role}&from=${from}`;
  return (
    <div className="space-y-3">
      <a href={googleHref} className="social-btn">
        <GoogleMark />
        Continue with Google
      </a>
      <a href={appleHref} className="social-btn">
        <AppleMark />
        Continue with Apple
      </a>
      <p className="text-center text-[11px] text-ink/50">
        Google and Apple only finish when TTN has set those keys on the server. Email still works.
      </p>
      <p className="auth-divider">or use email</p>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.4c-.3 1.5-1.1 2.8-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.7z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1C3.4 21.4 7.4 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.4 14.4c-.2-.7-.4-1.5-.4-2.4s.1-1.7.4-2.4V6.5H1.4C.5 8.2 0 10 0 12s.5 3.8 1.4 5.5l4-3.1z"
      />
      <path
        fill="#EA4335"
        d="M12 4.8c1.7 0 3.3.6 4.5 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0 7.4 0 3.4 2.6 1.4 6.5l4 3.1C6.3 6.8 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}

function AppleMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
      <path d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.2c1.1-1.1 1.5-2.1 1.5-2.2-.1 0-2.8-1.1-2.8-4.3zM14.7 5.8c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z" />
    </svg>
  );
}

export function LoginForm({
  role,
  demoEmail,
  demoPassword,
  oauthError,
}: {
  role: "TRAVELER" | "AGENCY" | "ADMIN";
  demoEmail?: string;
  demoPassword?: string;
  oauthError?: string;
}) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await login(formData);
      return result?.error || null;
    },
    null,
  );
  return (
    <div className="space-y-4">
      {role !== "ADMIN" ? <SocialLogin role={role} from="login" /> : null}
      <OAuthError code={oauthError} />
      <form action={action} className="space-y-4">
        <input type="hidden" name="role" value={role} />
        <Field label="Email or username">
          <input
            name="email"
            type="text"
            autoComplete="username"
            required
            className={inputClass}
            defaultValue={demoEmail}
          />
        </Field>
        <Field label="Password">
          <input
            name="password"
            type="password"
            required
            className={inputClass}
            autoComplete="current-password"
            defaultValue={demoPassword}
          />
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
    </div>
  );
}

export function TravelerSignupForm({ oauthError }: { oauthError?: string }) {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await signupTraveler(formData);
      return result?.error || null;
    },
    null,
  );
  return (
    <div className="space-y-4">
      <SocialLogin role="TRAVELER" from="signup" />
      <OAuthError code={oauthError} />
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
    </div>
  );
}
