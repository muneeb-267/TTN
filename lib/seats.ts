import type { Prisma } from "@prisma/client";

export type SeatBlueprint = {
  code: string;
  row: number;
  col: number;
  aisleAfter: boolean;
};

export async function claimSeats(
  tx: Prisma.TransactionClient,
  tripId: string,
  codes: string[],
  bookingId: string,
) {
  const unique = [...new Set(codes)];
  const claimed = await tx.seat.updateMany({
    where: { tripId, code: { in: unique }, bookingId: null },
    data: { bookingId },
  });
  if (claimed.count !== unique.length) {
    throw new Error("One of those seats was just taken. Pick again.");
  }
  return claimed.count;
}

export function layoutSeats(seatCount: number): SeatBlueprint[] {
  const seats: SeatBlueprint[] = [];
  let n = 1;
  let row = 1;
  while (n <= seatCount) {
    const remaining = seatCount - n + 1;
    const colsThisRow = remaining === 5 ? 5 : Math.min(4, remaining);
    for (let col = 1; col <= colsThisRow; col++) {
      seats.push({
        code: String(n),
        row,
        col,
        aisleAfter: colsThisRow >= 4 && col === 2,
      });
      n += 1;
    }
    row += 1;
  }
  return seats;
}
