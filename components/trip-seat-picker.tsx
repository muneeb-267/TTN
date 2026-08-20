"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SeatMap } from "@/components/seat-map";
import { pkr } from "@/lib/format";

type Seat = {
  code: string;
  row: number;
  col: number;
  aisleAfter: boolean;
  taken: boolean;
  held?: boolean;
};

export function TripSeatPicker({
  tripId,
  seats,
  pricePerSeat,
  depositPerSeat,
}: {
  tripId: string;
  seats: Seat[];
  pricePerSeat: number;
  depositPerSeat: number;
}) {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();
  const chosen = useMemo(() => selected.join(","), [selected]);
  const total = selected.length * pricePerSeat;
  const due = selected.length * depositPerSeat;

  return (
    <div className="space-y-5">
      <SeatMap
        seats={seats}
        selected={selected}
        onToggle={(code) =>
          setSelected((cur) =>
            cur.includes(code) ? cur.filter((c) => c !== code) : [...cur, code],
          )
        }
      />
      {selected.length ? (
        <div className="rounded-2xl bg-sand/70 p-4 text-sm">
          <p className="font-semibold">
            {selected.length} seat{selected.length === 1 ? "" : "s"} selected
          </p>
          <p className="mt-1">{pkr(total)} total</p>
          <p className="text-ink/70">{pkr(due)} due today</p>
        </div>
      ) : null}
      <button
        type="button"
        disabled={!selected.length}
        onClick={() => router.push(`/trips/${tripId}/checkout?seats=${encodeURIComponent(chosen)}`)}
        className="btn-gold w-full rounded-full px-5 py-3 font-semibold disabled:opacity-40"
      >
        {selected.length ? "Select Seats" : "Select seats to continue"}
      </button>
    </div>
  );
}
