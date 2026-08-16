"use client";

import { useRouter } from "next/navigation";
import { CITIES, DESTINATIONS } from "@/lib/constants";

export function TripFilters({ from, to }: { from: string; to: string }) {
  const router = useRouter();

  function apply(nextFrom: string, nextTo: string) {
    const params = new URLSearchParams();
    if (nextFrom) params.set("from", nextFrom);
    if (nextTo) params.set("to", nextTo);
    const query = params.toString();
    router.push(query ? `/trips?${query}` : "/trips");
  }

  return (
    <form
      className="mt-6 flex flex-wrap items-center gap-3"
      action="/trips"
      method="get"
      onSubmit={(e) => {
        e.preventDefault();
        const data = new FormData(e.currentTarget);
        apply(String(data.get("from") || ""), String(data.get("to") || ""));
      }}
    >
      <select
        name="from"
        value={from}
        onChange={(e) => apply(e.target.value, to)}
        className="rounded-full border border-ink/10 bg-white px-4 py-2"
      >
        <option value="">Any city</option>
        {CITIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        name="to"
        value={to}
        onChange={(e) => apply(from, e.target.value)}
        className="rounded-full border border-ink/10 bg-white px-4 py-2"
      >
        <option value="">Any destination</option>
        {DESTINATIONS.map((d) => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>
      <button className="btn-pine rounded-full px-4 py-2" type="submit">
        Filter
      </button>
      {from || to ? (
        <button
          type="button"
          className="text-link text-sm"
          onClick={() => apply("", "")}
        >
          Clear
        </button>
      ) : null}
    </form>
  );
}
