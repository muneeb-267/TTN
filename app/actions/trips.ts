"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { layoutSeats } from "@/lib/seats";
import { saveUploads } from "@/lib/uploads";

export async function createTrip(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return { error: "Agency login required." };
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency || agency.status !== "APPROVED") {
    return { error: "Your agency must be approved before posting trips." };
  }

  const title = String(formData.get("title") || "").trim();
  const fromCity = String(formData.get("fromCity") || "").trim();
  const toDestination = String(formData.get("toDestination") || "").trim();
  const departureAt = new Date(String(formData.get("departureAt") || ""));
  const returnAt = new Date(String(formData.get("returnAt") || ""));
  const vehicleType = String(formData.get("vehicleType") || "").trim();
  const vehicleDetail = String(formData.get("vehicleDetail") || "").trim();
  const seatCount = Number(formData.get("seatCount") || 0);
  const pricePerSeat = Number(formData.get("pricePerSeat") || 0);
  const itinerary = String(formData.get("itinerary") || "").trim();
  const hotelNames = formData.getAll("hotelName").map(String);
  const hotelUrls = formData.getAll("hotelUrl").map(String);
  const hotelLinks = hotelNames
    .map((name, i) => ({ name: name.trim(), url: (hotelUrls[i] || "").trim() }))
    .filter((h) => h.name && h.url);

  if (!title || !fromCity || !toDestination || Number.isNaN(departureAt.getTime())) {
    return { error: "Add the route, dates and trip title." };
  }
  if (seatCount < 4 || seatCount > 50) return { error: "Seat count should be between 4 and 50." };
  if (pricePerSeat < 1000) return { error: "Enter a valid price per seat." };
  if (returnAt <= departureAt) return { error: "Return must be after departure." };

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const media = await saveUploads(photos, "trip");
  const seats = layoutSeats(seatCount);

  const trip = await prisma.trip.create({
    data: {
      agencyId: agency.id,
      title,
      fromCity,
      toDestination,
      departureAt,
      returnAt,
      vehicleType,
      vehicleDetail,
      seatCount,
      pricePerSeat,
      itinerary,
      hotelLinks: JSON.stringify(hotelLinks),
      seats: { create: seats },
      media: {
        create: media.map((m) => ({
          agencyId: agency.id,
          kind: m.kind,
          url: m.url,
          caption: m.name,
        })),
      },
    },
  });

  revalidatePath("/trips");
  redirect(`/trips/${trip.id}`);
}

export async function addAgencyMedia(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return;
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency) return;
  const files = [
    ...formData.getAll("photos"),
    ...formData.getAll("videos"),
  ].filter((f): f is File => f instanceof File && f.size > 0);
  const saved = await saveUploads(files, "gallery");
  if (!saved.length) return;
  await prisma.media.createMany({
    data: saved.map((m) => ({
      agencyId: agency.id,
      kind: m.kind,
      url: m.url,
      caption: String(formData.get("caption") || m.name),
      isPreviousTrip: true,
    })),
  });
  revalidatePath("/agency/gallery");
}

export async function addComment(tripId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return;
  const body = String(formData.get("body") || "").trim();
  if (!body) return;
  await prisma.comment.create({
    data: { tripId, userId: session.id, body },
  });
  revalidatePath(`/trips/${tripId}`);
}

export async function addTripReview(bookingId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") return;
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true, review: true },
  });
  if (!booking || booking.travelerId !== session.id) return;
  if (booking.review) return;
  if (new Date() < booking.trip.returnAt) {
    return;
  }
  if (!["FULLY_PAID", "COMPLETED"].includes(booking.status)) {
    return;
  }
  const rating = Math.min(5, Math.max(1, Number(formData.get("rating") || 5)));
  const body = String(formData.get("body") || "").trim();
  await prisma.tripReview.create({
    data: {
      bookingId,
      travelerId: session.id,
      agencyId: booking.trip.agencyId,
      tripId: booking.tripId,
      rating,
      body: body || "Great trip.",
    },
  });
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  revalidatePath(`/traveler/bookings/${bookingId}`);
  revalidatePath(`/trips/${booking.tripId}`);
}
