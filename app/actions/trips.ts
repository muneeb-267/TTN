"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { layoutSeats } from "@/lib/seats";
import { getPlatformSettings } from "@/lib/platform-fees";
import { saveUploads } from "@/lib/uploads";

function readTripForm(formData: FormData) {
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
  const jazzcashName = String(formData.get("jazzcashName") || "").trim();
  const jazzcashNumber = String(formData.get("jazzcashNumber") || "").trim();
  const easypaisaName = String(formData.get("easypaisaName") || "").trim();
  const easypaisaNumber = String(formData.get("easypaisaNumber") || "").trim();
  const bankName = String(formData.get("bankName") || "").trim();
  const bankTitle = String(formData.get("bankTitle") || "").trim();
  const bankIban = String(formData.get("bankIban") || "").trim();
  const bankAccount = String(formData.get("bankAccount") || "").trim();
  const mealsIncluded = formData.get("mealsIncluded") === "on" || formData.get("mealsIncluded") === "1";
  const mealsDetail = String(formData.get("mealsDetail") || "").trim();
  const familyFriendly = formData.get("familyFriendly") === "on" || formData.get("familyFriendly") === "1";
  const tripStyle = String(formData.get("tripStyle") || "").trim();
  const meetingPoint = String(formData.get("meetingPoint") || "").trim();
  const importantInfo = String(formData.get("importantInfo") || "").trim();
  const hotelNames = formData.getAll("hotelName").map(String);
  const hotelUrls = formData.getAll("hotelUrl").map(String);
  const hotelRooms = formData.getAll("hotelRooms").map(String);
  const hotelLinks = hotelNames
    .map((name, i) => ({
      name: name.trim(),
      url: (hotelUrls[i] || "").trim(),
      rooms: (hotelRooms[i] || "").trim(),
    }))
    .filter((h) => h.name);

  if (!title || !fromCity || !toDestination || Number.isNaN(departureAt.getTime())) {
    return { ok: false as const, error: "Add the route, dates and trip title." };
  }
  if (seatCount < 4 || seatCount > 50) return { ok: false as const, error: "Seat count should be between 4 and 50." };
  if (pricePerSeat < 1000) return { ok: false as const, error: "Enter a valid price per seat." };
  if (returnAt <= departureAt) return { ok: false as const, error: "Return must be after departure." };
  if (!bankName || !bankTitle || !bankIban) {
    return { ok: false as const, error: "Bank name, account title and IBAN are required." };
  }

  return {
    ok: true as const,
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
    hotelLinks,
    jazzcashName,
    jazzcashNumber,
    easypaisaName,
    easypaisaNumber,
    bankName,
    bankTitle,
    bankIban,
    bankAccount,
    mealsIncluded,
    mealsDetail,
    familyFriendly,
    tripStyle,
    meetingPoint,
    importantInfo,
  };
}

export async function createTrip(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return { error: "Agency login required." };
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency || agency.status !== "APPROVED") {
    return { error: "Your agency must be approved before posting trips." };
  }

  const parsed = readTripForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const {
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
    hotelLinks,
    jazzcashName,
    jazzcashNumber,
    easypaisaName,
    easypaisaNumber,
    bankName,
    bankTitle,
    bankIban,
    bankAccount,
    mealsIncluded,
    mealsDetail,
    familyFriendly,
    tripStyle,
    meetingPoint,
    importantInfo,
  } = parsed;

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const media = await saveUploads(photos, "trip");
  const seats = layoutSeats(seatCount);

  const payout = {
    jazzcashName: jazzcashNumber ? jazzcashName || agency.businessName : "",
    jazzcashNumber,
    easypaisaName: easypaisaNumber ? easypaisaName || agency.businessName : "",
    easypaisaNumber,
    bankName,
    bankTitle: bankTitle || agency.businessName,
    bankIban,
    bankAccount,
  };

  const settings = await getPlatformSettings();
  const needsApproval = settings.requireTripApproval;
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
      mealsIncluded,
      includedJson: JSON.stringify(mealsDetail ? [mealsDetail] : []),
      familyFriendly,
      tripStyle,
      meetingPoint,
      importantInfo,
      published: !needsApproval,
      approvalStatus: needsApproval ? "PENDING_APPROVAL" : "PUBLISHED",
      ...payout,
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
  await prisma.agency.update({
    where: { id: agency.id },
    data: payout,
  });

  revalidatePath("/trips");
  revalidatePath("/agency/trips");
  revalidatePath("/agency/bookings");
  redirect(`/agency/trips`);
}

export async function updateTrip(tripId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return { error: "Agency login required." };
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency || agency.status !== "APPROVED") {
    return { error: "Your agency must be approved to edit trips." };
  }

  const trip = await prisma.trip.findUnique({
    where: { id: tripId },
    include: { seats: true },
  });
  if (!trip || trip.agencyId !== agency.id) return { error: "Trip not found." };
  if (trip.departureAt <= new Date()) {
    return { error: "This trip has already left. Details can no longer be edited." };
  }

  const parsed = readTripForm(formData);
  if (!parsed.ok) return { error: parsed.error };
  const {
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
    hotelLinks,
    jazzcashName,
    jazzcashNumber,
    easypaisaName,
    easypaisaNumber,
    bankName,
    bankTitle,
    bankIban,
    bankAccount,
    mealsIncluded,
    mealsDetail,
    familyFriendly,
    tripStyle,
    meetingPoint,
    importantInfo,
  } = parsed;

  const booked = trip.seats.filter((s) => s.bookingId);
  const highestBooked = Math.max(
    0,
    ...booked.map((s) => Number(s.code)).filter((n) => Number.isFinite(n)),
  );
  const minSeats = Math.max(4, booked.length, highestBooked);
  if (seatCount < minSeats) {
    return {
      error: `You already have ${booked.length} booked seat${booked.length === 1 ? "" : "s"}. Total seats cannot go below ${minSeats}.`,
    };
  }

  const payout = {
    jazzcashName: jazzcashNumber ? jazzcashName || agency.businessName : "",
    jazzcashNumber,
    easypaisaName: easypaisaNumber ? easypaisaName || agency.businessName : "",
    easypaisaNumber,
    bankName,
    bankTitle: bankTitle || agency.businessName,
    bankIban,
    bankAccount,
  };

  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const media = await saveUploads(photos, "trip");
  const layout = layoutSeats(seatCount);
  const keep = new Set(layout.map((s) => s.code));
  const extras = trip.seats.filter((s) => !keep.has(s.code));
  if (extras.some((s) => s.bookingId)) {
    return { error: "A booked seat is outside the new cabin size. Leave those seats in the total." };
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (extras.length) {
        await tx.seat.deleteMany({ where: { id: { in: extras.map((s) => s.id) } } });
      }
      for (const seat of layout) {
        const existing = trip.seats.find((s) => s.code === seat.code);
        if (existing) {
          await tx.seat.update({
            where: { id: existing.id },
            data: { row: seat.row, col: seat.col, aisleAfter: seat.aisleAfter },
          });
        } else {
          await tx.seat.create({
            data: { tripId, code: seat.code, row: seat.row, col: seat.col, aisleAfter: seat.aisleAfter },
          });
        }
      }
      await tx.trip.update({
        where: { id: tripId },
        data: {
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
          mealsIncluded,
          includedJson: JSON.stringify(mealsDetail ? [mealsDetail] : []),
          familyFriendly,
          tripStyle,
          meetingPoint,
          importantInfo,
          ...payout,
        },
      });
      if (media.length) {
        await tx.media.createMany({
          data: media.map((m) => ({
            agencyId: agency.id,
            tripId,
            kind: m.kind,
            url: m.url,
            caption: m.name,
          })),
        });
      }
      await tx.agency.update({ where: { id: agency.id }, data: payout });
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not save those changes." };
  }

  revalidatePath("/trips");
  revalidatePath(`/trips/${tripId}`);
  revalidatePath(`/agency/trips/${tripId}`);
  revalidatePath("/agency/trips");
  revalidatePath("/agency/bookings");
  revalidatePath("/agency");
  redirect(`/agency/trips`);
}

export async function removeTripPhoto(mediaId: string) {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return { error: "Agency login required." };
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency) return { error: "Agency not found." };
  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media || media.agencyId !== agency.id || !media.tripId) {
    return { error: "Photo not found." };
  }
  await prisma.media.delete({ where: { id: mediaId } });
  revalidatePath(`/agency/trips/${media.tripId}/edit`);
  revalidatePath(`/agency/trips/${media.tripId}`);
  revalidatePath(`/trips/${media.tripId}`);
  revalidatePath("/agency/trips");
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
  const photos = formData.getAll("photos").filter((f): f is File => f instanceof File && f.size > 0);
  const saved = await saveUploads(photos, "review");
  const review = await prisma.tripReview.create({
    data: {
      bookingId,
      travelerId: session.id,
      agencyId: booking.trip.agencyId,
      tripId: booking.tripId,
      rating,
      body: body || "Great trip.",
    },
  });
  if (saved.length) {
    await prisma.media.createMany({
      data: saved.map((m) => ({
        agencyId: booking.trip.agencyId,
        tripId: booking.tripId,
        reviewId: review.id,
        kind: "REVIEW",
        url: m.url,
        caption: m.name,
        isPreviousTrip: false,
      })),
    });
  }
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  revalidatePath(`/traveler/bookings/${bookingId}`);
  revalidatePath(`/trips/${booking.tripId}`);
}
