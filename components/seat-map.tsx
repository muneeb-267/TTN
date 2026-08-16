"use client";

type SeatView = {
  code: string;
  row: number;
  col: number;
  aisleAfter: boolean;
  taken: boolean;
  mine?: boolean;
};

export function SeatMap({
  seats,
  selected,
  onToggle,
  readOnly,
}: {
  seats: SeatView[];
  selected?: string[];
  onToggle?: (code: string) => void;
  readOnly?: boolean;
}) {
  const rows = Array.from(new Set(seats.map((s) => s.row))).sort((a, b) => a - b);
  const selectedSet = new Set(selected || []);

  return (
    <div className="rounded-[28px] bg-[#0d1a16] p-5 text-sand shadow-2xl sm:p-8">
      <div className="mx-auto mb-6 h-2 max-w-sm rounded-full bg-gradient-to-r from-transparent via-gold-2 to-transparent opacity-80" />
      <p className="mb-6 text-center text-xs tracking-[0.35em] text-gold-2/80">DRIVER · FRONT</p>
      <div className="space-y-3">
        {rows.map((row) => (
          <div key={row} className="flex items-center justify-center gap-2">
            {seats
              .filter((s) => s.row === row)
              .sort((a, b) => a.col - b.col)
              .map((seat) => {
                const isSelected = selectedSet.has(seat.code);
                const cls = seat.mine
                  ? "mine"
                  : seat.taken
                    ? "booked"
                    : isSelected
                      ? "selected"
                      : "available";
                return (
                  <span key={seat.code} className="flex items-center">
                    <button
                      type="button"
                      className={`seat ${cls}`}
                      disabled={readOnly || seat.taken}
                      onClick={() => onToggle?.(seat.code)}
                      aria-label={`Seat ${seat.code}`}
                    >
                      {seat.code}
                    </button>
                    {seat.aisleAfter ? <span className="w-6 sm:w-10" /> : null}
                  </span>
                );
              })}
          </div>
        ))}
      </div>
      <div className="mt-8 flex flex-wrap justify-center gap-4 text-xs text-sand/70">
        <Legend className="available" label="Available" />
        <Legend className="selected" label="Selected" />
        <Legend className="booked" label="Booked" />
        <Legend className="mine" label="Your seat" />
      </div>
    </div>
  );
}

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`seat ${className}`} style={{ width: "1.1rem", height: "1.1rem" }} />
      {label}
    </span>
  );
}
