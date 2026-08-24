import { SignJWT, jwtVerify, createRemoteJWKSet, importPKCS8 } from "jose";
import { redirect } from "next/navigation";
import { prisma } from "./prisma";
import { createSession } from "./auth";
import { authSecretValue } from "./env";
import { appBaseUrl } from "./payments";
import {
  isOAuthProvider,
  normalizeEmail,
  oauthReturnPath,
  parseOAuthFrom,
  parseOAuthRole,
  type OAuthProvider,
  type OAuthRole,
} from "./oauth-shared";

export {
  isOAuthProvider,
  normalizeEmail,
  oauthErrorCopy,
  oauthReturnPath,
  parseOAuthFrom,
  parseOAuthRole,
  type OAuthProvider,
  type OAuthRole,
} from "./oauth-shared";

const STATE_COOKIE_SECONDS = 60 * 10;
const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO = "https://openidconnect.googleapis.com/v1/userinfo";
const GOOGLE_JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));
const APPLE_AUTH = "https://appleid.apple.com/auth/authorize";
const APPLE_TOKEN = "https://appleid.apple.com/auth/token";
const APPLE_JWKS = createRemoteJWKSet(new URL("https://appleid.apple.com/auth/keys"));

type OAuthState = {
  provider: OAuthProvider;
  role: OAuthRole;
  nonce: string;
  from: "login" | "signup";
};

export function googleOAuthConfigured() {
  return Boolean((process.env.GOOGLE_CLIENT_ID || "").trim() && (process.env.GOOGLE_CLIENT_SECRET || "").trim());
}

function applePrivateKey() {
  return (process.env.APPLE_PRIVATE_KEY || "").trim().replace(/\\n/g, "\n");
}

export function appleOAuthConfigured() {
  return Boolean(
    (process.env.APPLE_CLIENT_ID || "").trim() &&
      (process.env.APPLE_TEAM_ID || "").trim() &&
      (process.env.APPLE_KEY_ID || "").trim() &&
      applePrivateKey(),
  );
}

function secret() {
  return new TextEncoder().encode(authSecretValue());
}

export async function createOAuthState(input: OAuthState) {
  return new SignJWT(input)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${STATE_COOKIE_SECONDS}s`)
    .sign(secret());
}

export async function readOAuthState(token: string | null | undefined): Promise<OAuthState | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!isOAuthProvider(String(payload.provider))) return null;
    return {
      provider: payload.provider as OAuthProvider,
      role: parseOAuthRole(String(payload.role || "")),
      nonce: String(payload.nonce || ""),
      from: parseOAuthFrom(String(payload.from || "")),
    };
  } catch {
    return null;
  }
}

export function oauthErrorRedirect(role: OAuthRole, from: "login" | "signup", code: string): never {
  redirect(`${oauthReturnPath(role, from)}?oauth_error=${encodeURIComponent(code)}`);
}

async function callbackOrigin() {
  return appBaseUrl();
}

export async function googleAuthorizeUrl(role: OAuthRole, from: "login" | "signup") {
  const nonce = crypto.randomUUID();
  const state = await createOAuthState({ provider: "google", role, nonce, from });
  const url = new URL(GOOGLE_AUTH);
  url.searchParams.set("client_id", process.env.GOOGLE_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", `${await callbackOrigin()}/api/auth/google/callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("scope", "openid email profile");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function appleAuthorizeUrl(role: OAuthRole, from: "login" | "signup") {
  const nonce = crypto.randomUUID();
  const state = await createOAuthState({ provider: "apple", role, nonce, from });
  const url = new URL(APPLE_AUTH);
  url.searchParams.set("client_id", process.env.APPLE_CLIENT_ID || "");
  url.searchParams.set("redirect_uri", `${await callbackOrigin()}/api/auth/apple/callback`);
  url.searchParams.set("response_type", "code id_token");
  url.searchParams.set("response_mode", "form_post");
  url.searchParams.set("scope", "name email");
  url.searchParams.set("state", state);
  url.searchParams.set("nonce", nonce);
  return url.toString();
}

async function appleClientSecret() {
  const pem = applePrivateKey();
  const key = await importPKCS8(pem, "ES256");
  const now = Math.floor(Date.now() / 1000);
  return new SignJWT({})
    .setProtectedHeader({ alg: "ES256", kid: process.env.APPLE_KEY_ID })
    .setIssuer(process.env.APPLE_TEAM_ID || "")
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60 * 24 * 150)
    .setAudience("https://appleid.apple.com")
    .setSubject(process.env.APPLE_CLIENT_ID || "")
    .sign(key);
}

type ProviderProfile = {
  providerAccountId: string;
  email: string;
  name: string;
  emailVerified?: boolean;
};

export async function googleProfileFromCode(code: string, nonce: string): Promise<ProviderProfile> {
  const body = new URLSearchParams({
    code,
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    client_secret: process.env.GOOGLE_CLIENT_SECRET || "",
    redirect_uri: `${await callbackOrigin()}/api/auth/google/callback`,
    grant_type: "authorization_code",
  });
  const tokenRes = await fetch(GOOGLE_TOKEN, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!tokenRes.ok) throw new Error("google_token");
  const tokens = (await tokenRes.json()) as { id_token?: string; access_token?: string };
  if (tokens.id_token) {
    const { payload } = await jwtVerify(tokens.id_token, GOOGLE_JWKS, {
      issuer: ["https://accounts.google.com", "accounts.google.com"],
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    if (nonce && payload.nonce && payload.nonce !== nonce) throw new Error("google_nonce");
  }
  const infoRes = await fetch(GOOGLE_USERINFO, {
    headers: { Authorization: `Bearer ${tokens.access_token || ""}` },
  });
  if (!infoRes.ok) throw new Error("google_userinfo");
  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    given_name?: string;
  };
  const email = normalizeEmail(info.email || "");
  if (!info.sub || !email) throw new Error("missing_email");
  if (info.email_verified === false) throw new Error("missing_email");
  return {
    providerAccountId: info.sub,
    email,
    name: (info.name || info.given_name || email.split("@")[0]).trim(),
    emailVerified: true,
  };
}

export async function appleProfileFromCallback(input: {
  idToken: string;
  code?: string;
  nonce: string;
  userJson?: string;
}): Promise<ProviderProfile> {
  const { payload } = await jwtVerify(input.idToken, APPLE_JWKS, {
    issuer: "https://appleid.apple.com",
    audience: process.env.APPLE_CLIENT_ID,
  });
  if (input.nonce && payload.nonce && String(payload.nonce) !== input.nonce) {
    throw new Error("apple_nonce");
  }
  if (input.code && appleOAuthConfigured()) {
    const tokenBody = new URLSearchParams({
      client_id: process.env.APPLE_CLIENT_ID || "",
      client_secret: await appleClientSecret(),
      code: input.code,
      grant_type: "authorization_code",
      redirect_uri: `${await callbackOrigin()}/api/auth/apple/callback`,
    });
    const tokenRes = await fetch(APPLE_TOKEN, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: tokenBody,
    });
    if (!tokenRes.ok) throw new Error("apple_token");
  }
  let nameFromForm = "";
  if (input.userJson) {
    try {
      const parsed = JSON.parse(input.userJson) as {
        name?: { firstName?: string; lastName?: string };
        email?: string;
      };
      nameFromForm = [parsed.name?.firstName, parsed.name?.lastName].filter(Boolean).join(" ").trim();
    } catch {
      nameFromForm = "";
    }
  }
  const email = normalizeEmail(String(payload.email || ""));
  const sub = String(payload.sub || "");
  if (!sub) throw new Error("failed");
  return {
    providerAccountId: sub,
    email,
    name: nameFromForm || (email ? email.split("@")[0] : "Apple traveler"),
  };
}

export async function finishOAuthSignIn(profile: ProviderProfile, state: OAuthState) {
  const linked = await prisma.oAuthAccount.findUnique({
    where: {
      provider_providerAccountId: {
        provider: state.provider,
        providerAccountId: profile.providerAccountId,
      },
    },
    include: { user: true },
  });
  if (linked) {
    return signInOAuthUser(linked.user, state.role);
  }

  const email = normalizeEmail(profile.email);
  if (!email) {
    oauthErrorRedirect(state.role, state.from, "missing_email");
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    if (existing.role === "ADMIN") oauthErrorRedirect(state.role, state.from, "staff");
    if (existing.role !== state.role) oauthErrorRedirect(state.role, state.from, "role_mismatch");
    await prisma.oAuthAccount.create({
      data: {
        userId: existing.id,
        provider: state.provider,
        providerAccountId: profile.providerAccountId,
        email,
      },
    });
    return signInOAuthUser(existing, state.role);
  }

  const user = await prisma.user.create({
    data: {
      email,
      name: profile.name || email.split("@")[0],
      role: state.role,
      passwordHash: null,
      oauthAccounts: {
        create: {
          provider: state.provider,
          providerAccountId: profile.providerAccountId,
          email,
        },
      },
    },
  });
  return signInOAuthUser(user, state.role);
}

async function signInOAuthUser(
  user: { id: string; email: string; name: string; role: string; suspendedAt?: Date | null },
  expectedRole: OAuthRole,
) {
  if (user.suspendedAt) oauthErrorRedirect(expectedRole, "login", "suspended");
  if (user.role === "ADMIN") oauthErrorRedirect(expectedRole, "login", "staff");
  if (user.role !== expectedRole) oauthErrorRedirect(expectedRole, "login", "role_mismatch");
  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "TRAVELER" | "AGENCY" | "ADMIN",
  });
  if (user.role === "AGENCY") redirect("/agency");
  redirect("/traveler");
}
