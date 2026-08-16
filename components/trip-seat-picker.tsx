"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { SeatMap } from "@/components/seat-map";

type Seat = {
  code: string;
  row: number;
  col: number;
  aisleAfter: boolean;
  taken: boolean;
};

export function TripSeatPicker({ tripId, seats }: { tripId: string; seats: Seat[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const router = useRouter();
  const chosen = useMemo(() => selected.join(","), [selected]);

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
      <button
        type="button"
        disabled={!selected.length}
        onClick={() => router.push(`/trips/${tripId}/checkout?seats=${encodeURIComponent(chosen)}`)}
        className="w-full rounded-full bg-gold px-5 py-3 font-semibold text-ink disabled:opacity-40"
      >
        Continue with {selected.length || 0} seat{selected.length === 1 ? "" : "s"}
      </button>
    </div>
  );
}
