import { CITIES, DESTINATIONS, VEHICLES } from "@/lib/constants";
import type { TripSearchInput } from "@/lib/trip-query";

export function TripFilters({ values }: { values: TripSearchInput }) {
  return (
    <form className="card mt-6 grid gap-3 rounded-3xl p-4 sm:grid-cols-2 lg:grid-cols-4" action="/trips" method="get">
      <label className="text-xs text-ink/60">
        Destination
        <select name="to" defaultValue={values.to || ""} className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm text-ink">
          <option value="">Any destination</option>
          {DESTINATIONS.map((d) => (
            <option key={d} value={d}>
              {d}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-ink/60">
        Departure city
        <select name="from" defaultValue={values.from || ""} className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm text-ink">
          <option value="">Any city</option>
          {CITIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-ink/60">
        Travel date
        <input type="date" name="date" defaultValue={values.date || ""} className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm" />
      </label>
      <label className="text-xs text-ink/60">
        Date to
        <input type="date" name="dateTo" defaultValue={values.dateTo || ""} className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm" />
      </label>
      <label className="text-xs text-ink/60">
        Min price (PKR)
        <input name="minPrice" defaultValue={values.minPrice || ""} inputMode="numeric" className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm" />
      </label>
      <label className="text-xs text-ink/60">
        Max price (PKR)
        <input name="maxPrice" defaultValue={values.maxPrice || ""} inputMode="numeric" className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm" />
      </label>
      <label className="text-xs text-ink/60">
        Vehicle
        <select name="vehicle" defaultValue={values.vehicle || ""} className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm">
          <option value="">Any vehicle</option>
          {VEHICLES.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs text-ink/60">
        Sort
        <select name="sort" defaultValue={values.sort || "recommended"} className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm">
          <option value="recommended">Recommended</option>
          <option value="price_asc">Price low to high</option>
          <option value="price_desc">Price high to low</option>
          <option value="rating">Highest rated</option>
          <option value="seats">Most seats available</option>
          <option value="soonest">Earliest departure</option>
          <option value="value">Best value</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/70 lg:col-span-2">
        <input type="checkbox" name="hotel" value="1" defaultChecked={values.hotel === "1"} /> Hotel included
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" name="meals" value="1" defaultChecked={values.meals === "1"} /> Meals included
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" name="family" value="1" defaultChecked={values.family === "1"} /> Family-friendly
      </label>
      <label className="flex items-center gap-2 text-sm text-ink/70">
        <input type="checkbox" name="verified" value="1" defaultChecked={values.verified === "1"} /> Verified agencies only
      </label>
      <label className="text-xs text-ink/60">
        Style
        <select name="style" defaultValue={values.style || ""} className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm">
          <option value="">Any</option>
          <option value="adventure">Adventure</option>
          <option value="luxury">Luxury</option>
          <option value="budget">Budget</option>
        </select>
      </label>
      <label className="text-xs text-ink/60">
        Min rating
        <select name="rating" defaultValue={values.rating || ""} className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm">
          <option value="">Any</option>
          <option value="3">3+</option>
          <option value="4">4+</option>
          <option value="4.5">4.5+</option>
        </select>
      </label>
      <label className="text-xs text-ink/60">
        Min seats
        <input name="seats" defaultValue={values.seats || ""} inputMode="numeric" className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm" />
      </label>
      <label className="text-xs text-ink/60 sm:col-span-2">
        Search
        <input
          name="q"
          defaultValue={values.q || ""}
          placeholder="Lahore to Hunza, trips under 30000…"
          className="mt-1 w-full rounded-full border border-ink/10 bg-white px-4 py-2 text-sm"
        />
      </label>
      <div className="flex items-end gap-2 sm:col-span-2 lg:col-span-4">
        <button className="btn-pine rounded-full px-5 py-2" type="submit">
          Find Trips
        </button>
        <a href="/trips" className="text-link px-2 py-2 text-sm">
          Clear
        </a>
      </div>
    </form>
  );
}
