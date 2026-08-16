"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { cancelSplit, quoteBooking } from "@/lib/booking";
import { prisma } from "@/lib/prisma";

export async function bookSeats(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") {
    return { error: "Sign in as a traveler to book." };
  }
  const tripId = String(formData.get("tripId") || "");
  const method = String(formData.get("method") || "jazzcash");
  const codes = String(formData.get("seats") || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (!tripId || !codes.length) return { error: "Select at least one seat." };

  let bookingId = "";
  try {
    bookingId = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId } });
      if (!trip || !trip.published) throw new Error("Trip not found.");
      const quote = quoteBooking(trip.pricePerSeat, codes.length, trip.departureAt);
      if (quote.daysUntilDeparture < 1) throw new Error("This trip has already departed.");

      const seats = await tx.seat.findMany({
        where: { tripId, code: { in: codes }, bookingId: null },
      });
      if (seats.length !== codes.length) {
        throw new Error("One of those seats was just taken. Pick again.");
      }

      const booking = await tx.booking.create({
        data: {
          publicRef: `TTN-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
          travelerId: session.id,
          tripId,
          status: quote.remainingAmount > 0 ? "DEPOSIT_PAID" : "FULLY_PAID",
          totalPrice: quote.totalPrice,
          depositAmount: quote.depositAmount,
          remainingAmount: quote.remainingAmount,
          platformFee: quote.platformFee,
          paymentMethod: method,
          remainingDueAt: quote.remainingDueAt,
          depositPaidAt: new Date(),
          remainingPaidAt: quote.remainingAmount === 0 ? new Date() : null,
        },
      });
      await tx.seat.updateMany({
        where: { id: { in: seats.map((s) => s.id) } },
        data: { bookingId: booking.id },
      });
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          kind: quote.remainingAmount > 0 ? "DEPOSIT" : "FULL",
          amount: quote.depositAmount,
          method,
        },
      });
      return booking.id;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not book those seats." };
  }
  revalidatePath(`/trips/${tripId}`);
  redirect(`/traveler/bookings/${bookingId}`);
}

export async function payRemaining(bookingId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Sign in required." };
  const method = String(formData.get("method") || "jazzcash");
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking || booking.travelerId !== session.id) return { error: "Booking not found." };
  if (booking.status !== "DEPOSIT_PAID") return { error: "Nothing remaining on this booking." };
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "FULLY_PAID",
      remainingPaidAt: new Date(),
      paymentMethod: method,
    },
  });
  await prisma.payment.create({
    data: {
      bookingId,
      kind: "REMAINING",
      amount: booking.remainingAmount,
      method,
    },
  });
  revalidatePath(`/traveler/bookings/${bookingId}`);
}

export async function requestRefund(bookingId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") return { error: "Traveler login required." };
  const reason = String(formData.get("reason") || "").trim();
  if (!reason) return { error: "Tell the agency why you are backing off." };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true, refund: true },
  });
  if (!booking || booking.travelerId !== session.id) return { error: "Booking not found." };
  if (booking.refund) return { error: "A refund request is already open." };
  if (!["DEPOSIT_PAID", "FULLY_PAID"].includes(booking.status)) {
    return { error: "This booking cannot be cancelled." };
  }

  const split = cancelSplit(booking.depositAmount, booking.bookedAt);
  const extraRemaining =
    booking.status === "FULLY_PAID" ? booking.remainingAmount : 0;

  await prisma.$transaction([
    prisma.refundRequest.create({
      data: {
        bookingId,
        travelerId: session.id,
        agencyId: booking.trip.agencyId,
        reason,
        status: split.sameDay ? "PENDING" : "APPROVED",
        sameDay: split.sameDay,
        travelerRefund: split.travelerRefund + extraRemaining,
        platformKeep: split.platformKeep,
        agencyKeep: split.agencyKeep,
        decidedAt: split.sameDay ? null : new Date(),
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: { status: split.sameDay ? "CANCEL_REQUESTED" : "CANCELLED" },
    }),
    ...(split.sameDay
      ? []
      : [
          prisma.seat.updateMany({
            where: { bookingId },
            data: { bookingId: null },
          }),
        ]),
  ]);

  revalidatePath(`/traveler/bookings/${bookingId}`);
  revalidatePath("/agency/refunds");
}

export async function decideRefund(refundId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "AGENCY") return;
  const agency = await prisma.agency.findUnique({ where: { userId: session.id } });
  if (!agency) return;
  const decision = String(formData.get("decision") || "");
  const note = String(formData.get("note") || "");
  const refund = await prisma.refundRequest.findUnique({
    where: { id: refundId },
    include: { booking: true },
  });
  if (!refund || refund.agencyId !== agency.id) return;
  if (refund.status !== "PENDING") return;

  const approved = decision === "approve";
  await prisma.$transaction([
    prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        agencyNote: note,
        decidedAt: new Date(),
      },
    }),
    prisma.booking.update({
      where: { id: refund.bookingId },
      data: {
        status: approved
          ? "CANCELLED"
          : refund.booking.remainingPaidAt
            ? "FULLY_PAID"
            : "DEPOSIT_PAID",
      },
    }),
    ...(approved
      ? [
          prisma.seat.updateMany({
            where: { bookingId: refund.bookingId },
            data: { bookingId: null },
          }),
        ]
      : []),
  ]);
  revalidatePath("/agency/refunds");
}
