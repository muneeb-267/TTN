"use server";

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { saveUploads } from "@/lib/uploads";

function agencyPaths(agencyId: string) {
  revalidatePath(`/agencies/${agencyId}`);
  revalidatePath("/agency/gallery");
  revalidatePath("/agency");
  revalidatePath("/");
}

export async function updateAgencyProfile(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return { error: "Sign in as an agency." };
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency) return { error: "Agency not found." };
  const about = String(formData.get("about") || "").trim();
  if (about && about.length < 20) {
    return { error: "Write a little more about your previous trips (at least 20 characters)." };
  }
  const avatarFiles = formData
    .getAll("avatar")
    .filter((f): f is File => f instanceof File && f.size > 0);
  if (!about && !avatarFiles.length) {
    return { error: "Choose a new picture or update your about text." };
  }
  const avatar = avatarFiles[0];
  if (avatar && !isStillImage(avatar)) {
    return { error: "Use a JPG, PNG or WebP picture for the profile photo." };
  }
  const saved = avatar ? await saveUploads([avatar], "avatar") : [];
  if (avatar && !saved[0]?.url) {
    return { error: "Could not save that picture. Try another JPG or PNG." };
  }
  await prisma.agency.update({
    where: { id: agency.id },
    data: {
      ...(about ? { about } : {}),
      ...(saved[0] ? { avatarUrl: saved[0].url } : {}),
    },
  });
  if (saved[0]) {
    await prisma.media.create({
      data: {
        agencyId: agency.id,
        kind: "AVATAR",
        url: saved[0].url,
        caption: "Profile picture",
        isPreviousTrip: false,
      },
    });
  }
  agencyPaths(agency.id);
  return { ok: true };
}

function isStillImage(file: File) {
  if (file.type.startsWith("image/") && !file.type.includes("heic") && !file.type.includes("heif")) {
    return true;
  }
  return /\.(jpe?g|png|webp|gif)$/i.test(file.name);
}

export async function removeAgencyMedia(mediaId: string) {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return;
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency) return;
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media || media.agencyId !== agency.id || media.tripId || media.reviewId) {
    return;
  }
  await prisma.media.delete({ where: { id: mediaId } });
  if (agency.avatarUrl === media.url) {
    await prisma.agency.update({ where: { id: agency.id }, data: { avatarUrl: "" } });
  }
  agencyPaths(agency.id);
}

export async function addAgencyComment(agencyId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Sign in to comment." };
  const agency = await prisma.agency.findUnique({ where: { id: agencyId, status: "APPROVED" } });
  if (!agency) return { error: "Agency not found." };
  const body = String(formData.get("body") || "").trim();
  if (body.length < 2) return { error: "Write a short comment." };
  await prisma.comment.create({
    data: { agencyId, userId: session.id, body },
  });
  revalidatePath(`/agencies/${agencyId}`);
}

export async function upsertAgencyReview(agencyId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Sign in to leave a review." };
  if (session.role === "AGENCY" && session.id) {
    const own = await prisma.agency.findUnique({ where: { userId: session.id } });
    if (own?.id === agencyId) return { error: "You cannot review your own agency." };
  }
  const agency = await prisma.agency.findUnique({ where: { id: agencyId, status: "APPROVED" } });
  if (!agency) return { error: "Agency not found." };
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") || 5)));
  const body = String(formData.get("body") || "").trim();
  if (body.length < 8) return { error: "Say a little more about the agency." };
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const saved = await saveUploads(photos, "review");
  const existing = await prisma.tripReview.findFirst({
    where: { agencyId, travelerId: session.id },
    orderBy: { createdAt: "desc" },
  });
  const review = existing
    ? await prisma.tripReview.update({
        where: { id: existing.id },
        data: { rating, body },
      })
    : await prisma.tripReview.create({
        data: {
          travelerId: session.id,
          agencyId,
          rating,
          body,
        },
      });
  if (saved.length) {
    await prisma.media.createMany({
      data: saved.map((m) => ({
        agencyId,
        reviewId: review.id,
        kind: "REVIEW",
        url: m.url,
        caption: m.name,
        isPreviousTrip: false,
      })),
    });
  }
  revalidatePath(`/agencies/${agencyId}`);
  revalidatePath("/");
  revalidatePath("/trips");
}
