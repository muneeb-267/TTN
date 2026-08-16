"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import {
  createSession,
  destroySession,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { saveUploads } from "@/lib/uploads";
import {
  MIN_CLIENT_PHONES,
  MIN_CNIC_PHOTOS,
  MIN_PREVIOUS_PHOTOS,
  MIN_WHATSAPP_REVIEWS,
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
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const password = String(formData.get("password") || "");
  const expectedRole = String(formData.get("role") || "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return { error: "Email or password is incorrect." };
  }
  if (expectedRole && user.role !== expectedRole) {
    return { error: `This login is for ${expectedRole.toLowerCase()}s.` };
  }
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
  if (!name || !email || password.length < 6) {
    return { error: "Name, email and a password of at least 6 characters are required." };
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
  const name = String(formData.get("name") || "").trim();
  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();
  const phone = String(formData.get("phone") || "").trim();
  const password = String(formData.get("password") || "");
  const businessName = String(formData.get("businessName") || "").trim();
  const city = String(formData.get("city") || "").trim();
  const about = String(formData.get("about") || "").trim();
  const declared = formData.get("realMedia") === "on";
  const phones = collectPhones(formData);

  if (!name || !email || !businessName || password.length < 6) {
    return { error: "Fill in account and agency details." };
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

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "That email is already registered." };

  const photoFiles = await saveUploads(photos, "agency-photo");
  const videoFiles = await saveUploads(videos, "agency-video");
  const whatsappFiles = await saveUploads(whatsapp, "whatsapp-review");
  const cnicFiles = await saveUploads(cnics, "cnic");

  const user = await prisma.user.create({
    data: {
      name,
      email,
      phone,
      passwordHash: await hashPassword(password),
      role: "AGENCY",
      agency: {
        create: {
          businessName,
          city,
          about,
          status: "PENDING",
          realMediaDeclaration: true,
          clientPhones: JSON.stringify(phones),
          media: {
            create: [
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
            ],
          },
        },
      },
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
