"use client";

import { useActionState, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createTrip, updateTrip, removeTripPhoto, setTripCover } from "@/app/actions/trips";
import { CITIES, DESTINATIONS, VEHICLES } from "@/lib/constants";
import { layoutSeats } from "@/lib/seats";
import { Field, inputClass } from "@/components/fields";
import { SeatMap } from "@/components/seat-map";

export type TripFormTrip = {
  id: string;
  title: string;
  fromCity: string;
  toDestination: string;
  departureAt: string;
  returnAt: string;
  vehicleType: string;
  vehicleDetail: string;
  seatCount: number;
  pricePerSeat: number;
  itinerary: string;
  hotels: { name: string; url: string; rooms?: string }[];
  mealsIncluded?: boolean;
  mealsDetail?: string;
  familyFriendly?: boolean;
  tripStyle?: string;
  meetingPoint?: string;
  importantInfo?: string;
  depositBps?: number | null;
  cancelPolicyJson?: string;
  jazzcashName?: string;
  jazzcashNumber?: string;
  easypaisaName?: string;
  easypaisaNumber?: string;
  bankName?: string;
  bankTitle?: string;
  bankIban?: string;
  bankAccount?: string;
  minSeatCount?: number;
  bookedSeats?: number;
  coverUrl?: string;
  photos?: { id: string; url: string; caption: string }[];
};

export function TripForm({
  defaults,
  trip,
}: {
  defaults?: {
    jazzcashName?: string;
    jazzcashNumber?: string;
    easypaisaName?: string;
    easypaisaNumber?: string;
    bankName?: string;
    bankTitle?: string;
    bankIban?: string;
    bankAccount?: string;
  };
  trip?: TripFormTrip;
}) {
  const editing = Boolean(trip);
  const router = useRouter();
  const [error, action, pending] = useActionState(
    async (_: string | null, formData: FormData) => {
      const result = trip ? await updateTrip(trip.id, formData) : await createTrip(formData);
      return result?.error || null;
    },
    null,
  );
  const [seatCount, setSeatCount] = useState(trip?.seatCount || 18);
  const [hotels, setHotels] = useState(
    trip?.hotels.length ? trip.hotels : [{ name: "", url: "", rooms: "" }],
  );
  const preview = useMemo(
    () => layoutSeats(Math.min(50, Math.max(4, seatCount || 4))),
    [seatCount],
  );
  const minSeats = trip?.minSeatCount || 4;

  return (
    <form action={action} className="space-y-8">
      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Route and dates</h2>
        <Field label="Trip title">
          <input
            name="title"
            required
            className={inputClass}
            placeholder="8 days Hunza & Skardu"
            defaultValue={trip?.title}
          />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="From">
            <select name="fromCity" className={inputClass} defaultValue={trip?.fromCity || "Lahore"}>
              {CITIES.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="To">
            <select
              name="toDestination"
              className={inputClass}
              defaultValue={trip?.toDestination || "Hunza & Skardu"}
            >
              {DESTINATIONS.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>
          <Field label="Departure">
            <input
              name="departureAt"
              type="datetime-local"
              required
              className={inputClass}
              defaultValue={trip?.departureAt}
            />
          </Field>
          <Field label="Return">
            <input
              name="returnAt"
              type="datetime-local"
              required
              className={inputClass}
              defaultValue={trip?.returnAt}
            />
          </Field>
        </div>
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Vehicle and seats</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Vehicle">
            <select name="vehicleType" className={inputClass} defaultValue={trip?.vehicleType || "Grand Cabin"}>
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
              defaultValue={trip?.vehicleDetail}
            />
          </Field>
          <Field label="Total seats in the coaster">
            <input
              name="seatCount"
              type="number"
              min={minSeats}
              max={50}
              value={seatCount}
              onChange={(e) => setSeatCount(Number(e.target.value))}
              className={inputClass}
            />
          </Field>
          <Field label="Price per seat (PKR)">
            <input
              name="pricePerSeat"
              type="number"
              min={1000}
              required
              className={inputClass}
              defaultValue={trip?.pricePerSeat}
            />
          </Field>
        </div>
        {editing ? (
          <p className="text-sm text-ink/60">
            You can drop the total if the cabin is smaller than listed — for example 28 down to 20.
            {trip?.bookedSeats
              ? ` ${trip.bookedSeats} seat${trip.bookedSeats === 1 ? " is" : "s are"} already booked, so the total cannot go below ${minSeats}.`
              : " Empty seats come off the map. Already-booked seats stay."}
            Existing bookings keep their original fare if you change the price.
          </p>
        ) : (
          <p className="text-sm text-ink/60">Preview of the cinema-style map travelers will use.</p>
        )}
        <SeatMap readOnly seats={preview.map((s) => ({ ...s, taken: false }))} />
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Hotel, meals and photos</h2>
        <Field label="Itinerary and other details">
          <textarea name="itinerary" rows={6} className={inputClass} required defaultValue={trip?.itinerary} />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="mealsIncluded" defaultChecked={trip?.mealsIncluded} /> Meals included
        </label>
        <Field label="Meal plan (breakfast, lunch, dinner…)">
          <textarea
            name="mealsDetail"
            rows={2}
            className={inputClass}
            placeholder="e.g. Breakfast and dinner at the hotel. Lunch on the road."
            defaultValue={trip?.mealsDetail}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="familyFriendly" defaultChecked={trip?.familyFriendly} /> Family-friendly
        </label>
        <Field label="Style">
          <select name="tripStyle" className={inputClass} defaultValue={trip?.tripStyle || ""}>
            <option value="">Unspecified</option>
            <option value="adventure">Adventure</option>
            <option value="luxury">Luxury</option>
            <option value="budget">Budget</option>
          </select>
        </Field>
        <Field label="Meeting point">
          <input name="meetingPoint" className={inputClass} defaultValue={trip?.meetingPoint} placeholder="Thokar Niaz Baig, 10pm" />
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Initial payment % (deposit)">
            <input
              name="depositPercent"
              type="number"
              min={10}
              max={100}
              className={inputClass}
              defaultValue={trip?.depositBps ? Math.round(trip.depositBps / 100) : 50}
            />
          </Field>
          <p className="self-end text-sm text-ink/60">
            Remaining amount is due one day before departure (platform default).
          </p>
        </div>
        <Field label="Cancellation policy (shown on the trip page)">
          <textarea
            name="cancelPolicy"
            rows={3}
            className={inputClass}
            placeholder="Leave blank to use TTN’s default 24-hour / split-deposit rules."
            defaultValue={trip?.cancelPolicyJson}
          />
        </Field>
        <Field label="Important information">
          <textarea name="importantInfo" rows={3} className={inputClass} defaultValue={trip?.importantInfo} />
        </Field>
        <div className="space-y-3">
          <p className="text-sm font-medium">Hotels and rooms</p>
          {hotels.map((hotel, i) => (
            <div key={i} className="grid gap-3 sm:grid-cols-3">
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
                name="hotelRooms"
                className={inputClass}
                placeholder="Rooms e.g. 6 deluxe twins"
                value={hotel.rooms || ""}
                onChange={(e) =>
                  setHotels((cur) => cur.map((h, idx) => (idx === i ? { ...h, rooms: e.target.value } : h)))
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
            className="text-link text-sm"
            onClick={() => setHotels((cur) => [...cur, { name: "", url: "", rooms: "" }])}
          >
            + Add another hotel
          </button>
        </div>
        <Field label="Main trip picture (what travelers see on Explore)">
          <input name="cover" type="file" accept="image/*" className={inputClass} />
        </Field>
        {trip?.coverUrl ? (
          <div>
            <p className="text-sm font-medium">Current listing picture</p>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={trip.coverUrl} alt="Listing cover" className="mt-2 h-40 w-full rounded-2xl object-cover" />
          </div>
        ) : (
          <p className="text-sm text-ink/60">
            Upload your own photo of the coaster, hotel or valley. Travelers will see this on the trip
            list instead of a platform stock shot.
          </p>
        )}
        {trip?.photos?.length ? (
          <div>
            <p className="text-sm font-medium">Current trip photos</p>
            <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {trip.photos.map((photo) => (
                <div key={photo.id} className="overflow-hidden rounded-2xl border-2 border-gold/50">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo.url} alt={photo.caption || "Trip photo"} className="h-32 w-full object-cover" />
                  <div className="flex">
                    {trip.coverUrl === photo.url ? (
                      <span className="flex-1 bg-gold py-1.5 text-center text-xs font-semibold text-ink">
                        Listing picture
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="flex-1 bg-sand py-1.5 text-xs font-semibold text-pine"
                        onClick={async () => {
                          await setTripCover(photo.id);
                          router.refresh();
                        }}
                      >
                        Use as listing
                      </button>
                    )}
                    <button
                      type="button"
                      className="flex-1 bg-pine py-1.5 text-xs font-semibold text-sand"
                      onClick={async () => {
                        await removeTripPhoto(photo.id);
                        router.refresh();
                      }}
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
        <Field label={editing ? "Add more trip photos" : "More trip photos"}>
          <input name="photos" type="file" accept="image/*" multiple className={inputClass} />
        </Field>
      </section>

      <section className="card space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="display text-2xl">Payout accounts</h2>
        <p className="text-sm text-ink/65">
          Bank details are required. JazzCash and EasyPaisa are optional extras. Travelers see bank
          first. Saved for the next trip too.
        </p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank name">
            <input
              name="bankName"
              required
              className={inputClass}
              placeholder="Meezan, HBL, UBL…"
              defaultValue={trip?.bankName || defaults?.bankName}
            />
          </Field>
          <Field label="Bank account title">
            <input
              name="bankTitle"
              required
              className={inputClass}
              placeholder="Name on the bank account"
              defaultValue={trip?.bankTitle || defaults?.bankTitle}
            />
          </Field>
          <Field label="IBAN">
            <input
              name="bankIban"
              required
              className={inputClass}
              placeholder="PK00…"
              defaultValue={trip?.bankIban || defaults?.bankIban}
            />
          </Field>
          <Field label="Account number (optional)">
            <input
              name="bankAccount"
              className={inputClass}
              placeholder="If you also want the account no."
              defaultValue={trip?.bankAccount || defaults?.bankAccount}
            />
          </Field>
        </div>
        <p className="pt-2 text-sm font-medium text-ink/80">Optional wallets</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="EasyPaisa account name">
            <input
              name="easypaisaName"
              className={inputClass}
              placeholder="Name on EasyPaisa"
              defaultValue={trip?.easypaisaName || defaults?.easypaisaName}
            />
          </Field>
          <Field label="EasyPaisa number">
            <input
              name="easypaisaNumber"
              className={inputClass}
              placeholder="03xxxxxxxxx"
              defaultValue={trip?.easypaisaNumber || defaults?.easypaisaNumber}
            />
          </Field>
          <Field label="JazzCash account name">
            <input
              name="jazzcashName"
              className={inputClass}
              placeholder="Name on JazzCash"
              defaultValue={trip?.jazzcashName || defaults?.jazzcashName}
            />
          </Field>
          <Field label="JazzCash number">
            <input
              name="jazzcashNumber"
              className={inputClass}
              placeholder="03xxxxxxxxx"
              defaultValue={trip?.jazzcashNumber || defaults?.jazzcashNumber}
            />
          </Field>
        </div>
      </section>

      {error ? <p className="text-sm text-red-800">{error}</p> : null}
      <button disabled={pending} className="btn-gold w-full rounded-full px-5 py-3 font-semibold">
        {pending ? (editing ? "Saving…" : "Publishing…") : editing ? "Save changes" : "Publish trip"}
      </button>
    </form>
  );
}
