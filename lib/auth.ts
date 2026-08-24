import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";
import { authSecretValue } from "./env";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  role: "TRAVELER" | "AGENCY" | "ADMIN";
};

const COOKIE = "ttn_session";

function secret() {
  return new TextEncoder().encode(authSecretValue());
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

async function cookieSecure() {
  const { headers } = await import("next/headers");
  const proto = (await headers()).get("x-forwarded-proto") || "";
  return proto.split(",")[0].trim() === "https";
}

export async function createSession(user: SessionUser) {
  const token = await new SignJWT(user)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("14d")
    .sign(secret());
  const store = await cookies();
  store.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: await cookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24 * 14,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.id || !payload.email || !payload.role) return null;
    return {
      id: String(payload.id),
      email: String(payload.email),
      name: String(payload.name || ""),
      role: payload.role as SessionUser["role"],
    };
  } catch {
    return null;
  }
}

export async function requireUser() {
  const session = await getSession();
  if (!session) throw new Error("You need to sign in first.");
  return session;
}

export async function getUserRecord() {
  const session = await getSession();
  if (!session) return null;
  return prisma.user.findUnique({
    where: { id: session.id },
    include: { agency: true },
  });
}
