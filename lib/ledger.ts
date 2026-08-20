import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient | typeof import("./prisma").prisma;

export const LEDGER = {
  GROSS: "GROSS",
  COMMISSION: "COMMISSION",
  PROCESSING_FEE: "PROCESSING_FEE",
  AGENCY_SETTLEMENT: "AGENCY_SETTLEMENT",
  REFUND: "REFUND",
  NET_REVENUE: "NET_REVENUE",
  CANCEL_KEEP: "CANCEL_KEEP",
  AGENCY_FINE: "AGENCY_FINE",
} as const;

export async function postLedger(
  db: Tx,
  input: {
    bookingId?: string;
    agencyId?: string;
    type: string;
    amount: number;
    reference: string;
    note?: string;
    currency?: string;
  },
) {
  try {
    await db.ledgerEntry.create({
      data: {
        bookingId: input.bookingId,
        agencyId: input.agencyId,
        type: input.type,
        amount: input.amount,
        currency: input.currency || "PKR",
        reference: input.reference,
        note: input.note || "",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("Unique constraint") || message.includes("UNIQUE")) return;
    throw err;
  }
}

export async function postBookingLedgers(
  db: Tx,
  booking: {
    id: string;
    publicRef: string;
    trip: { agencyId: string };
    totalPrice: number;
    platformFee: number;
    processingFee: number;
    agencySettlement: number;
    netRevenue: number;
  },
) {
  const ref = booking.publicRef;
  const agencyId = booking.trip.agencyId;
  await postLedger(db, {
    bookingId: booking.id,
    agencyId,
    type: LEDGER.GROSS,
    amount: booking.totalPrice,
    reference: `${ref}:GROSS`,
    note: "Gross booking amount",
  });
  await postLedger(db, {
    bookingId: booking.id,
    agencyId,
    type: LEDGER.COMMISSION,
    amount: booking.platformFee,
    reference: `${ref}:COMMISSION`,
    note: "TTN platform commission snapshot",
  });
  await postLedger(db, {
    bookingId: booking.id,
    agencyId,
    type: LEDGER.PROCESSING_FEE,
    amount: booking.processingFee,
    reference: `${ref}:FEE`,
    note: "Payment processing fee (provider agreement)",
  });
  await postLedger(db, {
    bookingId: booking.id,
    agencyId,
    type: LEDGER.AGENCY_SETTLEMENT,
    amount: booking.agencySettlement,
    reference: `${ref}:AGENCY`,
    note: "Agency payable before refunds",
  });
  await postLedger(db, {
    bookingId: booking.id,
    agencyId,
    type: LEDGER.NET_REVENUE,
    amount: booking.netRevenue,
    reference: `${ref}:NET`,
    note: "TTN net revenue at confirmation",
  });
}
