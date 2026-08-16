export type SeatBlueprint = {
  code: string;
  row: number;
  col: number;
  aisleAfter: boolean;
};

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
