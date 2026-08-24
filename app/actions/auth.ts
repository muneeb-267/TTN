"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  getSession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { saveUploads } from "@/lib/uploads";
import {
  MIN_CLIENT_PHONES,
  MIN_CNIC_PHOTOS,
  MIN_PREVIOUS_PHOTOS,
  MIN_WHATSAPP_REVIEWS,
  MIN_PASSWORD_LENGTH,
} from "@/lib/constants";

export async function setLocale(formData: FormData) {
  const locale = formData.get("locale") === "ur" ? "ur" : "en";
  const store = await cookies();
  store.set("ttn_lang", locale, { path: "/", maxAge: 60 * 60 * 24 * 365 });
}

export async function logout() {
  await destroySession();
  redirect("/");
}

export async function login(formData: FormData) {
  const identifier = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const expectedRole = String(formData.get("role") || "");
  const user = await findUserByLogin(identifier);
  if (!user) {
    return { error: "Email or password is incorrect." };
  }
  if (!user.passwordHash) {
    return { error: "This account uses Google or Apple. Continue with that button." };
  }
  if (!(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }
  if (user.suspendedAt) {
    return { error: "This account is suspended. Contact TTN support." };
  }
  if (user.role === "ADMIN") {
    if (expectedRole && expectedRole !== "ADMIN") {
      return { error: "Staff sign in from the admin portal." };
    }
    return signInAndGo(user);
  }
  if (expectedRole && user.role !== expectedRole) {
    return { error: `This login is for ${expectedRole.toLowerCase()}s.` };
  }
  return signInAndGo(user);
}

async function findUserByLogin(identifier: string) {
  const raw = identifier.trim();
  const email = raw.toLowerCase();
  if (!raw) return null;
  if (email.includes("@")) {
    return prisma.user.findUnique({ where: { email } });
  }
  const aliased = await prisma.user.findUnique({ where: { email: `${email}@ttn.pk` } });
  if (aliased) return aliased;
  const staff = await prisma.user.findMany({ where: { role: "ADMIN" } });
  return (
    staff.find(
      (user) => user.name.toLowerCase() === raw.toLowerCase() || user.email.split("@")[0] === email,
    ) || null
  );
}

async function signInAndGo(user: { id: string; email: string; name: string; role: string }) {
  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role as "TRAVELER" | "AGENCY" | "ADMIN",
  });
  if (user.role === "ADMIN") redirect("/admin");
  if (user.role === "AGENCY") redirect("/agency");
  redirect("/traveler");
}

export async function signupTraveler(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  if (!name || !email || password.length < MIN_PASSWORD_LENGTH) {
    return { error: `Name, email and a password of at least ${MIN_PASSWORD_LENGTH} characters are required.` };
  }
  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "That email is already registered." };
  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role: "TRAVELER",
    },
  });
  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: "TRAVELER",
  });
  redirect("/traveler");
}

function collectPhones(formData: FormData) {
  return formData
    .getAll("clientPhone")
    .map((v) => String(v).trim())
    .filter((v) => v.length >= 10);
}

export async function signupAgency(formData: FormData) {
  const session = await getSession();
  const oauthUser =
    session?.role === "AGENCY"
      ? await prisma.user.findUnique({ where: { id: session.id }, include: { agency: true } })
      : null;
  if (oauthUser?.agency) redirect("/agency");
  const viaOAuth = Boolean(oauthUser && !oauthUser.agency);

  const name = String(formData.get("name") || "").trim();
  const email = viaOAuth
    ? oauthUser!.email
    : String(formData.get("email") || "")
        .trim()
        .toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const businessName = String(formData.get("businessName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const aboutRaw = String(formData.get("about") || "").trim();
  const operatingCities = String(formData.get("operatingCities") || "").trim();
  const about = operatingCities
    ? `Operating cities: ${[city, operatingCities].filter(Boolean).join(", ")}\n\n${aboutRaw}`
    : aboutRaw;
  const declared = formData.get("realMedia") === "on";
  const phones = collectPhones(formData);

  if (!name || !email || !businessName) {
    return { error: "Fill in account and agency details." };
  }
  if (!viaOAuth && password.length < MIN_PASSWORD_LENGTH) {
    return {
      error: `Fill in account and agency details, with a password of at least ${MIN_PASSWORD_LENGTH} characters.`,
    };
  }
  if (!declared) {
    return { error: "You must confirm that photos and videos are real, not AI generated." };
  }
  if (phones.length < MIN_CLIENT_PHONES) {
    return { error: `Add at least ${MIN_CLIENT_PHONES} client phone numbers for review confirmation.` };
  }

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const videos = formData.getAll("videos").filter((f): f is File => f instanceof File && f.size > 0);
  const whatsapp = formData.getAll("whatsappReviews").filter((f): f is File => f instanceof File && f.size > 0);
  const cnics = formData.getAll("cnicPhotos").filter((f): f is File => f instanceof File && f.size > 0);

  if (photos.length < MIN_PREVIOUS_PHOTOS) {
    return { error: `Add at least ${MIN_PREVIOUS_PHOTOS} real photos from previous trips.` };
  }
  if (whatsapp.length < MIN_WHATSAPP_REVIEWS) {
    return {
      error: `Upload at least ${MIN_WHATSAPP_REVIEWS} WhatsApp review screenshots from clients.`,
    };
  }
  if (cnics.length < MIN_CNIC_PHOTOS) {
    return { error: "Upload CNIC pictures of two people (mandatory)." };
  }

  if (!viaOAuth) {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return { error: "That email is already registered." };
  }

  const photoFiles = await saveUploads(photos, "agency-photo");
  const videoFiles = await saveUploads(videos, "agency-video");
  const whatsappFiles = await saveUploads(whatsapp, "whatsapp-review");
  const cnicFiles = await saveUploads(cnics, "cnic");
  const mediaCreate = [
    ...photoFiles.map((m) => ({
      kind: m.kind,
      url: m.url,
      caption: m.name,
      isPreviousTrip: true,
    })),
    ...videoFiles.map((m) => ({
      kind: m.kind,
      url: m.url,
      caption: m.name,
      isPreviousTrip: true,
    })),
    ...whatsappFiles.map((m) => ({
      kind: "WHATSAPP",
      url: m.url,
      caption: m.name,
      isPreviousTrip: false,
    })),
    ...cnicFiles.map((m, i) => ({
      kind: "CNIC",
      url: m.url,
      caption: `CNIC person ${i + 1}`,
      isPreviousTrip: false,
    })),
  ];
  const agencyData = {
    businessName,
    city,
    about,
    status: "PENDING" as const,
    realMediaDeclaration: true,
    clientPhones: JSON.stringify(phones),
    media: { create: mediaCreate },
  };

  const user = viaOAuth
    ? await prisma.user.update({
        where: { id: oauthUser!.id },
        data: {
          name,
          phone,
          agency: { create: agencyData },
        },
      })
    : await prisma.user.create({
        data: {
          name,
          email,
          phone,
          passwordHash: await hashPassword(password),
          role: "AGENCY",
          agency: { create: agencyData },
        },
      });

  await createSession({
    id: user.id,
    email: user.email,
    name: user.name,
    role: "AGENCY",
  });
  redirect("/agency");
}
