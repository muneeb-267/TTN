import type { Prisma } from "@prisma/client";

type Tx = Prisma.TransactionClient;

export function formatBookingRef(year: number, seq: number) {
  return `TTN-${year}-${String(seq).padStart(6, "0")}`;
}

export async function nextBookingRef(tx: Tx, at = new Date()) {
  const year = at.getFullYear();
  const row = await tx.bookingSequence.upsert({
    where: { year },
    create: { year, lastSeq: 1 },
    update: { lastSeq: { increment: 1 } },
  });
  return formatBookingRef(year, row.lastSeq);
}
