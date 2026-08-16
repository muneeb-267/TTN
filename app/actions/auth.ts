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
import { MIN_PREVIOUS_PHOTOS, MIN_SIGNUP_REVIEWS } from "@/lib/constants";

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

type SignupReview = {
  clientName: string;
  rating: number;
  comment: string;
  tripDestination: string;
};

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
  const reviewsRaw = String(formData.get("reviews") || "[]");

  let reviews: SignupReview[] = [];
  try {
    reviews = JSON.parse(reviewsRaw) as SignupReview[];
  } catch {
    return { error: "Reviews could not be read." };
  }

  if (!name || !email || !businessName || password.length < 6) {
    return { error: "Fill in account and agency details." };
  }
  if (!declared) {
    return { error: "You must confirm that photos and videos are real, not AI generated." };
  }
  if (reviews.length < MIN_SIGNUP_REVIEWS) {
    return { error: `Upload at least ${MIN_SIGNUP_REVIEWS} real client reviews to register.` };
  }

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const videos = formData.getAll("videos").filter((f): f is File => f instanceof File && f.size > 0);
  if (photos.length < MIN_PREVIOUS_PHOTOS) {
    return { error: `Add at least ${MIN_PREVIOUS_PHOTOS} real photos from previous trips.` };
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return { error: "That email is already registered." };

  const photoFiles = await saveUploads(photos, "agency-photo");
  const videoFiles = await saveUploads(videos, "agency-video");

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
          signupReviews: {
            create: reviews.slice(0, 40).map((r) => ({
              clientName: r.clientName,
              rating: Math.min(5, Math.max(1, Number(r.rating) || 5)),
              comment: r.comment,
              tripDestination: r.tripDestination,
            })),
          },
          media: {
            create: [...photoFiles, ...videoFiles].map((m) => ({
              kind: m.kind,
              url: m.url,
              caption: m.name,
              isPreviousTrip: true,
            })),
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
