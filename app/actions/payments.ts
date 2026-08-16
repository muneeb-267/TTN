"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { saveUploads } from "@/lib/uploads";
import { notify } from "@/lib/notifications";
import { prisma } from "@/lib/prisma";
import {
  confirmPayment,
  notifyAdminsOfPayment,
  stripeConfigured,
} from "@/lib/payments";
import { createCardCheckout } from "@/lib/stripe";

export async function submitPaymentProof(paymentId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") return { error: "Sign in as a traveler." };
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment || payment.booking.travelerId !== session.id) return { error: "Payment not found." };
  if (payment.status !== "PENDING") return { error: "This payment is already closed." };

  const providerTxn = String(formData.get("providerTxn") || "").trim();
  const payerAccount = String(formData.get("payerAccount") || "").trim();
  if (payment.method === "bank") {
    if (!payerAccount) return { error: "Enter the account you sent from." };
  } else if (!providerTxn) {
    return { error: "Enter the JazzCash / EasyPaisa transaction ID (TID)." };
  }
  if (providerTxn && providerTxn.length < 6) {
    return { error: "That transaction ID looks too short." };
  }

  const files = formData.getAll("receipt").filter((f): f is File => f instanceof File);
  const saved = await saveUploads(files, `pay-${payment.booking.publicRef}`);

  await prisma.payment.update({
    where: { id: paymentId },
    data: {
      providerTxn,
      payerAccount,
      receiptUrl: saved[0]?.url || payment.receiptUrl,
    },
  });
  await notifyAdminsOfPayment({
    bookingRef: payment.booking.publicRef,
    amount: payment.amount,
    method: payment.method,
    href: "/admin",
  });
  revalidatePath(`/traveler/bookings/${payment.bookingId}/pay`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function startCardCheckout(paymentId: string) {
  const session = await getSession();
  if (!session || session.role !== "TRAVELER") return { error: "Sign in as a traveler." };
  if (!stripeConfigured()) return { error: "Card payments are not live yet. Use JazzCash, EasyPaisa or bank." };
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { trip: true } } },
  });
  if (!payment || payment.booking.travelerId !== session.id) return { error: "Payment not found." };
  if (payment.method !== "card") return { error: "This is not a card payment." };
  if (payment.status !== "PENDING") return { error: "This payment is already closed." };
  let url = "";
  try {
    const checkout = await createCardCheckout({
      paymentId: payment.id,
      bookingId: payment.bookingId,
      bookingRef: payment.booking.publicRef,
      title: payment.booking.trip.title,
      amountPkr: payment.amount,
    });
    url = checkout.url || "";
    await prisma.payment.update({
      where: { id: paymentId },
      data: { providerRef: checkout.id },
    });
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Could not start card checkout." };
  }
  if (!url) return { error: "Stripe did not return a checkout URL." };
  redirect(url);
}

export async function finalizeStripeReturn(paymentId: string, sessionId: string) {
  const session = await getSession();
  if (!session) return;
  const { getStripe } = await import("@/lib/stripe");
  const stripe = getStripe();
  if (!stripe || !sessionId) return;
  const checkout = await stripe.checkout.sessions.retrieve(sessionId);
  if (checkout.payment_status !== "paid") return;
  if (checkout.metadata?.paymentId !== paymentId) return;
  const payment = await prisma.payment.findUnique({ where: { id: paymentId }, include: { booking: true } });
  if (!payment || payment.booking.travelerId !== session.id) return;
  await confirmPayment(paymentId, { providerTxn: String(checkout.payment_intent || checkout.id) });
  revalidatePath(`/traveler/bookings/${payment.bookingId}`);
}

export async function adminConfirmPayment(paymentId: string) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return;
  const bookingId = await confirmPayment(paymentId);
  revalidatePath("/admin");
  revalidatePath(`/traveler/bookings/${bookingId}`);
  revalidatePath(`/traveler/bookings/${bookingId}/slip`);
}

export async function adminRejectPayment(paymentId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.role !== "ADMIN") return;
  const note = String(formData.get("note") || "Payment could not be matched.");
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: true },
  });
  if (!payment || payment.status !== "PENDING") return;
  await prisma.payment.update({
    where: { id: paymentId },
    data: { status: "FAILED", providerTxn: payment.providerTxn || note },
  });
  await notify({
    userId: payment.booking.travelerId,
    key: `pay-failed:${paymentId}`,
    title: "Payment not matched",
    body: `${note} Send again with the exact amount and booking ref ${payment.booking.publicRef}.`,
    href: `/traveler/bookings/${payment.bookingId}/pay`,
  });
  revalidatePath("/admin");
}
