import crypto from "node:crypto";
import { headers } from "next/headers";
import { PAYMENT_HOLD_MINUTES, PAYMENT_METHODS } from "./constants";
import { prisma } from "./prisma";
import { notify } from "./notifications";
import { postBookingLedgers } from "./ledger";
import { getFinanceRates } from "./platform-fees";

export type PayMethod = "jazzcash" | "easypaisa" | "bank" | "card";

export type PayCollection = "MANUAL" | "INSTANT";

export function isPayMethod(value: string): value is PayMethod {
  return ["jazzcash", "easypaisa", "bank", "card"].includes(value);
}

export function isPayCollection(value: string): value is PayCollection {
  return value === "MANUAL" || value === "INSTANT";
}

export async function appBaseUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, "");
  const h = await headers();
  const proto = h.get("x-forwarded-proto") || "http";
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  return `${proto}://${host}`;
}

export function paymentAccounts() {
  return {
    jazzcash: {
      name: process.env.TTN_JAZZCASH_NAME || "TTN Travel To North",
      number: process.env.TTN_JAZZCASH_NUMBER || "",
    },
    easypaisa: {
      name: process.env.TTN_EASYPAISA_NAME || "TTN Travel To North",
      number: process.env.TTN_EASYPAISA_NUMBER || "",
    },
    bank: {
      name: process.env.TTN_BANK_NAME || "",
      title: process.env.TTN_BANK_TITLE || "TTN Travel To North",
      iban: process.env.TTN_BANK_IBAN || "",
      account: process.env.TTN_BANK_ACCOUNT || "",
    },
  };
}

export type PayoutAccounts = ReturnType<typeof paymentAccounts>;

type AccountSource = {
  jazzcashName?: string | null;
  jazzcashNumber?: string | null;
  easypaisaName?: string | null;
  easypaisaNumber?: string | null;
  bankName?: string | null;
  bankTitle?: string | null;
  bankIban?: string | null;
  bankAccount?: string | null;
};

export function agencyPayoutAccounts(trip?: AccountSource | null, agency?: AccountSource | null) {
  return {
    jazzcash: {
      name: trip?.jazzcashName || agency?.jazzcashName || "",
      number: trip?.jazzcashNumber || agency?.jazzcashNumber || "",
    },
    easypaisa: {
      name: trip?.easypaisaName || agency?.easypaisaName || "",
      number: trip?.easypaisaNumber || agency?.easypaisaNumber || "",
    },
    bank: {
      name: trip?.bankName || agency?.bankName || "",
      title: trip?.bankTitle || agency?.bankTitle || "",
      iban: trip?.bankIban || agency?.bankIban || "",
      account: trip?.bankAccount || agency?.bankAccount || "",
    },
  };
}

export function payoutAccounts(trip?: AccountSource | null, agency?: AccountSource | null): PayoutAccounts {
  const listed = agencyPayoutAccounts(trip, agency);
  const platform = paymentAccounts();
  return {
    jazzcash: {
      name: listed.jazzcash.name || platform.jazzcash.name,
      number: listed.jazzcash.number || platform.jazzcash.number,
    },
    easypaisa: {
      name: listed.easypaisa.name || platform.easypaisa.name,
      number: listed.easypaisa.number || platform.easypaisa.number,
    },
    bank: {
      name: listed.bank.name || platform.bank.name,
      title: listed.bank.title || platform.bank.title,
      iban: listed.bank.iban || platform.bank.iban,
      account: listed.bank.account || platform.bank.account,
    },
  };
}

export function listedPayMethods(trip?: AccountSource | null, agency?: AccountSource | null) {
  const listed = agencyPayoutAccounts(trip, agency);
  return PAYMENT_METHODS.filter((method) => {
    if (method.id === "card") return false;
    if (method.id === "bank") return true;
    if (method.id === "easypaisa") return Boolean(listed.easypaisa.number);
    if (method.id === "jazzcash") return Boolean(listed.jazzcash.number);
    return false;
  });
}

export function jazzcashConfigured() {
  return Boolean(
    process.env.JAZZCASH_MERCHANT_ID &&
      process.env.JAZZCASH_PASSWORD &&
      process.env.JAZZCASH_INTEGRITY_SALT,
  );
}

export function stripeConfigured() {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function easypaisaConfigured() {
  return Boolean(process.env.EASYPAISA_STORE_ID && process.env.EASYPAISA_HASH_KEY);
}

export function instantPayMethods() {
  const methods: { id: PayMethod; label: string; blurb: string }[] = [];
  if (stripeConfigured()) {
    methods.push({
      id: "card",
      label: "Debit or credit card",
      blurb: "Pay on Stripe’s secure page — the same idea as Spotify Premium. TTN never sees your card number.",
    });
  }
  if (jazzcashConfigured()) {
    methods.push({
      id: "jazzcash",
      label: "JazzCash",
      blurb: "Confirm in JazzCash instantly. No screenshot needed.",
    });
  }
  return methods;
}

export function manualPayMethods(trip?: AccountSource | null, agency?: AccountSource | null) {
  return listedPayMethods(trip, agency);
}

export function holdUntil(from = new Date(), minutes = PAYMENT_HOLD_MINUTES) {
  return new Date(from.getTime() + minutes * 60 * 1000);
}

export async function holdUntilFromSettings(from = new Date()) {
  const rates = await getFinanceRates();
  return holdUntil(from, rates.seatHoldMinutes);
}

export async function releaseExpiredHolds(now = new Date()) {
  const expired = await prisma.booking.findMany({
    where: {
      status: "AWAITING_PAYMENT",
      holdUntil: { lte: now },
    },
    select: { id: true },
  });
  for (const booking of expired) {
    await prisma.$transaction([
      prisma.seat.updateMany({ where: { bookingId: booking.id }, data: { bookingId: null } }),
      prisma.payment.updateMany({
        where: { bookingId: booking.id, status: "PENDING" },
        data: { status: "EXPIRED" },
      }),
      prisma.booking.update({
        where: { id: booking.id },
        data: { status: "EXPIRED", holdUntil: null },
      }),
    ]);
  }
}

export function jazzcashHash(fields: Record<string, string>, salt: string) {
  const values = Object.keys(fields)
    .filter((key) => key !== "pp_SecureHash" && fields[key] !== "")
    .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()))
    .map((key) => fields[key]);
  const message = [salt, ...values].join("&");
  return crypto.createHmac("sha256", salt).update(message, "utf8").digest("hex").toUpperCase();
}

export function jazzcashHostedRequest(input: {
  amountPkr: number;
  txnRef: string;
  billRef: string;
  description: string;
  returnUrl: string;
}) {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT || "";
  const now = new Date();
  const stamp = (d: Date) =>
    `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}${String(d.getSeconds()).padStart(2, "0")}`;
  const expiry = new Date(now.getTime() + PAYMENT_HOLD_MINUTES * 60 * 1000);
  const fields: Record<string, string> = {
    pp_Version: "1.1",
    pp_TxnType: "MWALLET",
    pp_Language: "EN",
    pp_MerchantID: process.env.JAZZCASH_MERCHANT_ID || "",
    pp_Password: process.env.JAZZCASH_PASSWORD || "",
    pp_TxnRefNo: input.txnRef,
    pp_Amount: String(Math.round(input.amountPkr * 100)).padStart(12, "0"),
    pp_TxnCurrency: "PKR",
    pp_TxnDateTime: stamp(now),
    pp_BillReference: input.billRef,
    pp_Description: input.description.slice(0, 90),
    pp_TxnExpiryDateTime: stamp(expiry),
    pp_ReturnURL: input.returnUrl,
  };
  fields.pp_SecureHash = jazzcashHash(fields, salt);
  const sandbox = (process.env.JAZZCASH_ENV || "sandbox") !== "production";
  return {
    action: sandbox
      ? "https://sandbox.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/"
      : "https://payments.jazzcash.com.pk/CustomerPortal/transactionmanagement/merchantform/",
    fields,
  };
}

export function verifyJazzcashResponse(fields: Record<string, string>) {
  const salt = process.env.JAZZCASH_INTEGRITY_SALT || "";
  if (!salt) return false;
  const received = (fields.pp_SecureHash || "").toUpperCase();
  const expected = jazzcashHash(fields, salt);
  if (received.length !== expected.length) return false;
  return crypto.timingSafeEqual(Buffer.from(received), Buffer.from(expected));
}

export async function confirmPayment(paymentId: string, extra?: { providerTxn?: string; payerAccount?: string }) {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: { booking: { include: { trip: { include: { agency: true } }, traveler: true } } },
  });
  if (!payment) throw new Error("Payment not found.");
  if (payment.status === "CONFIRMED") return payment.bookingId;
  if (payment.status === "EXPIRED" || payment.status === "FAILED") {
    throw new Error("This payment can no longer be confirmed.");
  }

  const remainingKind = payment.kind === "REMAINING";
  const fullyPaid = remainingKind || payment.kind === "FULL" || payment.booking.remainingAmount === 0;
  await prisma.$transaction(async (tx) => {
    await tx.payment.update({
      where: { id: paymentId },
      data: {
        status: "CONFIRMED",
        confirmedAt: new Date(),
        respondedAt: new Date(),
        providerTxn: extra?.providerTxn || payment.providerTxn,
        payerAccount: extra?.payerAccount || payment.payerAccount,
      },
    });
    await tx.booking.update({
      where: { id: payment.bookingId },
      data: remainingKind
        ? { status: "FULLY_PAID", remainingPaidAt: new Date(), holdUntil: null }
        : {
            status: fullyPaid ? "FULLY_PAID" : "DEPOSIT_PAID",
            depositPaidAt: new Date(),
            remainingPaidAt: fullyPaid ? new Date() : null,
            holdUntil: null,
          },
    });
    if (!remainingKind) {
      await postBookingLedgers(tx, {
        id: payment.booking.id,
        publicRef: payment.booking.publicRef,
        trip: { agencyId: payment.booking.trip.agencyId },
        totalPrice: payment.booking.totalPrice,
        platformFee: payment.booking.platformFee,
        processingFee: payment.booking.processingFee,
        agencySettlement: payment.booking.agencySettlement,
        netRevenue: payment.booking.netRevenue,
      });
    }
  });

  const booking = payment.booking;
  if (payment.collectedByPlatform) {
    const { applyDivertedPayment } = await import("./platform-fees");
    await applyDivertedPayment(booking.trip.agencyId, payment.id, payment.amount, payment.method);
  } else {
    await notify({
      userId: booking.trip.agency.userId,
      key: `paid:${paymentId}`,
      title: remainingKind ? "Remaining 50% received" : "Deposit received",
      body: `${booking.traveler.name} paid ${payment.amount} PKR via ${payment.method} for ${booking.trip.title} (${booking.publicRef}).`,
      href: `/agency/trips/${booking.tripId}`,
    });
  }
  await notify({
    userId: booking.travelerId,
    key: `slip:${booking.id}`,
    title: remainingKind ? "Remaining 50% confirmed" : fullyPaid ? "Payment confirmed" : "50% deposit confirmed",
    body: remainingKind
      ? `Your remaining payment is confirmed for ${booking.trip.title}.`
      : `Seats are locked against ${booking.publicRef}.`,
    href: `/traveler/bookings/${booking.id}/slip`,
  });
  return booking.id;
}

export async function notifyAdminsOfPayment(input: {
  bookingRef: string;
  amount: number;
  method: string;
  href: string;
}) {
  const admins = await prisma.user.findMany({ where: { role: "ADMIN" } });
  await Promise.all(
    admins.map((admin) =>
      notify({
        userId: admin.id,
        key: `pay-review:${input.bookingRef}:${input.method}:${input.amount}`,
        title: "Payment waiting for confirmation",
        body: `${input.bookingRef}: ${input.amount} PKR via ${input.method}. Match it in JazzCash / EasyPaisa / bank, then confirm.`,
        href: input.href,
      }),
    ),
  );
}

export function randomTxnRef() {
  return `T${Date.now()}${crypto.randomBytes(2).toString("hex").toUpperCase()}`;
}

export function integrationSuffix() {
  return crypto.randomBytes(4).toString("hex");
}
