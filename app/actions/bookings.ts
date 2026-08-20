"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { cancelSplit, quoteBooking } from "@/lib/booking";
import { nextBookingRef } from "@/lib/booking-ref";
import { LEDGER, postLedger } from "@/lib/ledger";
import { notify } from "@/lib/notifications";
import { holdUntil, instantPayMethods, isPayCollection, isPayMethod, releaseExpiredHolds } from "@/lib/payments";
import { getFinanceRates, getPlatformSettings, travelerPayOptions } from "@/lib/platform-fees";
import { prisma } from "@/lib/prisma";
import { claimSeats } from "@/lib/seats";

export async function bookSeats(formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") {
    return { error: "Sign in as a traveler to book." };
  }
  const tripId = String(formData.get("tripId") || "");
  const method = String(formData.get("method") || "bank");
  const collection = String(formData.get("collection") || "MANUAL").toUpperCase();
  if (!isPayMethod(method)) return { error: "Choose bank, EasyPaisa, JazzCash or card." };
  if (!isPayCollection(collection)) return { error: "Choose instant pay or a transfer to the listed account." };
  const codes = [...new Set(
    String(formData.get("seats") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
  )];
  if (!tripId || !codes.length) return { error: "Select at least one seat." };

  let bookingId = "";
  try {
    await releaseExpiredHolds();
    const snapshot = await prisma.trip.findUnique({ where: { id: tripId }, include: { agency: true } });
    if (!snapshot || !snapshot.published || snapshot.agency.status !== "APPROVED") {
      return { error: "Trip not found." };
    }
    const pay = await travelerPayOptions(snapshot, snapshot.agency);
    if (collection === "INSTANT") {
      if (!instantPayMethods().some((m) => m.id === method)) {
        return { error: "That instant method is not live yet. Transfer to the listed account and upload a screenshot." };
      }
    } else if (!pay.methods.some((m) => m.id === method)) {
      return { error: "That payment method is not listed for this trip." };
    }
    const collectedByPlatform = collection === "INSTANT" || pay.diverted;
    const settings = await getPlatformSettings();
    if (codes.length > settings.maxBookingSeats) {
      return { error: `You can book at most ${settings.maxBookingSeats} seats at once.` };
    }
    const rates = await getFinanceRates();
    bookingId = await prisma.$transaction(async (tx) => {
      const trip = await tx.trip.findUnique({ where: { id: tripId }, include: { agency: true } });
      if (!trip || !trip.published || trip.agency.status !== "APPROVED") throw new Error("Trip not found.");
      const quote = quoteBooking(trip.pricePerSeat, codes.length, trip.departureAt, {
        ...rates,
        depositBps: trip.depositBps || rates.depositBps,
      });
      if (quote.daysUntilDeparture < 1) throw new Error("This trip has already departed.");

      const publicRef = await nextBookingRef(tx);
      const booking = await tx.booking.create({
        data: {
          publicRef,
          travelerId: session.id,
          tripId,
          status: "AWAITING_PAYMENT",
          totalPrice: quote.totalPrice,
          depositAmount: quote.depositAmount,
          remainingAmount: quote.remainingAmount,
          platformFee: quote.platformFee,
          processingFee: quote.processingFee,
          agencySettlement: quote.agencySettlement,
          refundAmount: 0,
          netRevenue: quote.netRevenue,
          commissionBps: quote.commissionBps,
          processingFeeBps: quote.processingFeeBps,
          paymentMethod: method,
          remainingDueAt: quote.remainingDueAt,
          holdUntil: holdUntil(new Date(), rates.seatHoldMinutes),
        },
      });
      await claimSeats(tx, tripId, codes, booking.id);
      await tx.payment.create({
        data: {
          bookingId: booking.id,
          kind: quote.remainingAmount > 0 ? "DEPOSIT" : "FULL",
          amount: quote.depositAmount,
          method,
          status: "PENDING",
          collection,
          collectedByPlatform,
          idempotencyKey: `pay:${booking.id}:DEPOSIT`,
        },
      });
      await tx.notification.create({
        data: {
          userId: session.id,
          key: `pay:${booking.id}`,
          title: "Pay to lock your seats",
          body:
            collection === "INSTANT"
              ? `Seats ${codes.join(", ")} are held for ${rates.seatHoldMinutes} minutes. Pay ${quote.depositAmount} PKR instantly via ${method} to confirm ${booking.publicRef}.`
              : `Seats ${codes.join(", ")} are held for ${rates.seatHoldMinutes} minutes. Transfer ${quote.depositAmount} PKR via ${method} and upload a screenshot to confirm ${booking.publicRef}.`,
          href: `/traveler/bookings/${booking.id}/pay`,
        },
      });
      return booking.id;
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not book those seats." };
  }
  revalidatePath(`/trips/${tripId}`);
  revalidatePath("/inbox");
  redirect(`/traveler/bookings/${bookingId}/pay`);
}

export async function payRemaining(bookingId: string, formData: FormData) {
  const session = await getSession();
  if (!session) return { error: "Sign in required." };
  const method = String(formData.get("method") || "bank");
  const collection = String(formData.get("collection") || "MANUAL").toUpperCase();
  if (!isPayMethod(method)) return { error: "Choose a payment method." };
  if (!isPayCollection(collection)) return { error: "Choose instant pay or a transfer to the listed account." };
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: { include: { agency: true } } },
  });
  if (!booking || booking.travelerId !== session.id) return { error: "Booking not found." };
  if (booking.status !== "DEPOSIT_PAID") return { error: "Nothing remaining on this booking." };
  const pay = await travelerPayOptions(booking.trip, booking.trip.agency);
  if (collection === "INSTANT") {
    if (!instantPayMethods().some((m) => m.id === method)) {
      return { error: "That instant method is not live yet. Transfer to the listed account and upload a screenshot." };
    }
  } else if (!pay.methods.some((m) => m.id === method)) {
    return { error: "That payment method is not listed for this trip." };
  }
  const open = await prisma.payment.findFirst({
    where: { bookingId, kind: "REMAINING", status: "PENDING" },
  });
  if (open) {
    redirect(`/traveler/bookings/${bookingId}/pay`);
  }
  await prisma.payment.create({
    data: {
      bookingId,
      kind: "REMAINING",
      amount: booking.remainingAmount,
      method,
      status: "PENDING",
      collection,
      collectedByPlatform: collection === "INSTANT" || pay.diverted,
    },
  });
  await prisma.booking.update({
    where: { id: bookingId },
    data: { paymentMethod: method },
  });
  revalidatePath(`/traveler/bookings/${bookingId}`);
  redirect(`/traveler/bookings/${bookingId}/pay`);
}

export async function requestRefund(bookingId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") return { error: "Traveler login required." };
  const reason = String(formData.get("reason") || "").trim();
  const payoutMethod = String(formData.get("payoutMethod") || "").trim();
  const payoutAccountName = String(formData.get("payoutAccountName") || "").trim();
  const payoutAccountNo = String(formData.get("payoutAccountNo") || "").trim();
  const payoutBank = String(formData.get("payoutBank") || "").trim();
  if (!reason) return { error: "Tell the agency why you are backing off." };
  if (!payoutAccountName || !payoutAccountNo) {
    return { error: "Give account details so the agency can send the refund." };
  }
  if (payoutMethod === "bank" && !payoutBank) {
    return { error: "Add the bank name for the refund transfer." };
  }

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { trip: true, refund: true },
  });
  if (!booking || booking.travelerId !== session.id) return { error: "Booking not found." };
  if (booking.refund) return { error: "A refund request is already open." };
  if (booking.status !== "DEPOSIT_PAID" || booking.remainingPaidAt) {
    return { error: "Refunds are only available before you pay the remaining 50%." };
  }

  const split = cancelSplit(booking.depositAmount, booking.bookedAt);

  await prisma.$transaction([
    prisma.refundRequest.create({
      data: {
        bookingId,
        travelerId: session.id,
        agencyId: booking.trip.agencyId,
        reason,
        status: split.sameDay ? "PENDING" : "APPROVED",
        sameDay: split.sameDay,
        travelerRefund: split.travelerRefund,
        platformKeep: split.platformKeep,
        agencyKeep: split.agencyKeep,
        decidedAt: split.sameDay ? null : new Date(),
        payoutMethod,
        payoutAccountName,
        payoutAccountNo,
        payoutBank,
      },
    }),
    prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: split.sameDay ? "CANCEL_REQUESTED" : "CANCELLED",
        refundAmount: split.travelerRefund,
        netRevenue: split.platformKeep - booking.processingFee,
        agencySettlement: split.agencyKeep,
      },
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
  if (!split.sameDay) {
    await postLedger(prisma, {
      bookingId,
      agencyId: booking.trip.agencyId,
      type: LEDGER.REFUND,
      amount: split.travelerRefund,
      reference: `${booking.publicRef}:REFUND`,
      note: "Late-cancel traveler refund",
    });
  }

  const agency = await prisma.agency.findUnique({ where: { id: booking.trip.agencyId } });
  if (agency) {
    await notify({
      userId: agency.userId,
      key: `refund:${bookingId}`,
      title: split.sameDay ? "Refund within 24 hours — you must pay it back" : "Late cancel processed",
      body: split.sameDay
        ? `${session.name} asked for a full refund on ${booking.trip.title}. Send ${split.travelerRefund} PKR to ${payoutAccountName} (${payoutMethod} ${payoutAccountNo}). Approve it. If you refuse, TTN fines you one seat fare (${booking.trip.pricePerSeat} PKR).`
        : `${session.name} cancelled seats on ${booking.trip.title}. Send the refund to ${payoutAccountName} (${payoutMethod} ${payoutAccountNo}).`,
      href: "/agency/refunds",
    });
  }

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
    include: { booking: { include: { trip: true, traveler: true } } },
  });
  if (!refund || refund.agencyId !== agency.id) return;
  if (refund.status !== "PENDING") return;

  const approved = decision === "approve";
  const fine = !approved && refund.sameDay ? refund.booking.trip.pricePerSeat : 0;
  await prisma.$transaction([
    prisma.refundRequest.update({
      where: { id: refundId },
      data: {
        status: approved ? "APPROVED" : "REJECTED",
        agencyNote: note,
        decidedAt: new Date(),
        agencyFine: fine,
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

  await notify({
    userId: refund.booking.travelerId,
    key: `refund-decision:${refund.bookingId}`,
    title: approved ? "Refund approved" : "Refund refused",
    body: approved
      ? `The agency approved your refund on ${refund.booking.trip.title}.`
      : refund.sameDay
        ? `The agency refused a refund requested within 24 hours. TTN has fined them one seat fare (${refund.booking.trip.pricePerSeat} PKR). Your booking stays.`
        : `The agency refused the refund on ${refund.booking.trip.title}. Your booking stays.`,
    href: `/traveler/bookings/${refund.bookingId}`,
  });
  if (fine) {
    await notify({
      userId: agency.userId,
      key: `refund-fine:${refund.bookingId}`,
      title: "24-hour refund refused — fine charged",
      body: `You refused a refund asked within 24 hours. TTN fined you ${refund.booking.trip.pricePerSeat} PKR (one seat on ${refund.booking.trip.title}).`,
      href: "/agency/refunds",
    });
  }
  revalidatePath("/agency/refunds");
  revalidatePath("/admin");
}
