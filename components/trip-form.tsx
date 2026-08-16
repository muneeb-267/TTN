"use client";

import { useActionState, useMemo, useState } from "react";
import { createTrip } from "@/app/actions/trips";
import { CITIES, DESTINATIONS, VEHICLES } from "@/lib/constants";
import { layoutSeats } from "@/lib/seats";
import { Field, inputClass } from "@/components/fields";
import { SeatMap } from "@/components/seat-map";

export function TripForm() {
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = await createTrip(formData);
      return result?.error || null;
    },
    null,
  );
  const [seatCount, setSeatCount] = useState(18);
  const [hotels, setHotels] = useState([{ name: "", url: "" }]);
  const preview = useMemo(
    () => layoutSeats(Math.min(50, Math.max(4, seatCount || 4))),
    [seatCount],
  );

  return (
    <form action={action} className="space-y-8">
      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Route and dates</h2>
        <Field label="Trip title">
          <input name="title" required className={inputClass} placeholder="8 days Hunza & Skardu" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From">
            <select name="fromCity" className={inputClass} defaultValue="Lahore">
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="To">
            <select name="toDestination" className={inputClass} defaultValue="Hunza & Skardu">
              {DESTINATIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Departure">
            <input name="departureAt" type="datetime-local" required className={inputClass} />
          </Field>
          <Field label="Return">
            <input name="returnAt" type="datetime-local" required className={inputClass} />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Vehicle and seats</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vehicle">
            <select name="vehicleType" className={inputClass} defaultValue="Grand Cabin">
              {VEHICLES.map((v) => (
                <option key={v}>{v}</option>
              ))}
            </select>
          </Field>
          <Field label="Vehicle details">
            <input
              name="vehicleDetail"
              className={inputClass}
              placeholder="2023 model, recliner, AC"
            />
          </Field>
          <Field label="How many seats?">
            <input
              name="seatCount"
              type="number"
              min={4}
              max={50}
              value={seatCount}
              onChange={(e) => setSeatCount(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Price per seat (PKR)">
            <input name="pricePerSeat" type="number" min={1000} required className={inputClass} />
          </Field>
        </div>
        <p className="text-sm text-ink/60">Preview of the cinema-style map travelers will use.</p>
        <SeatMap
          readOnly
          seats={preview.map((s) => ({ ...s, taken: false }))}
        />
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Stay, plan, photos</h2>
        <Field label="Itinerary and other details">
          <textarea name="itinerary" rows={6} className={inputClass} required />
        </Field>
        <div className="space-y-3">
          <p className="text-sm font-medium">Hotel links</p>
          {hotels.map((hotel, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-2">
              <input
                name="hotelName"
                className={inputClass}
                placeholder="Hotel name"
                value={hotel.name}
                onChange={(e) =>
                  setHotels((cur) => cur.map((h, idx) => (idx === i ? { ...h, name: e.target.value } : h)))
                }
              />
              <input
                name="hotelUrl"
                className={inputClass}
                placeholder="https://"
                value={hotel.url}
                onChange={(e) =>
                  setHotels((cur) => cur.map((h, idx) => (idx === i ? { ...h, url: e.target.value } : h)))
                }
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm text-moss"
            onClick={() => setHotels((cur) => [...cur, { name: "", url: "" }])}
          >
            + Add another hotel
          </button>
        </div>
        <Field label="Trip photos">
          <input name="photos" type="file" accept="image/*" multiple className={inputClass} />
        </Field>
      </section>

      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button
        disabled={pending}
        className="w-full rounded-full bg-gold px-5 py-3 font-semibold text-ink"
      >
        {pending ? "Publishing…" : "Publish trip"}
      </button>
    </form>
  );
}
