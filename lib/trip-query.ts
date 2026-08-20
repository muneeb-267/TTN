import { CITIES, VEHICLES } from "./constants";
import { parseHotelLinks } from "./format";

export type TripSearchInput = {
  from?: string;
  to?: string;
  date?: string;
  dateTo?: string;
  minPrice?: string;
  maxPrice?: string;
  minDuration?: string;
  maxDuration?: string;
  seats?: string;
  vehicle?: string;
  hotel?: string;
  meals?: string;
  family?: string;
  style?: string;
  verified?: string;
  rating?: string;
  sort?: string;
  q?: string;
};

export type PublicTrip = {
  id: string;
  title: string;
  fromCity: string;
  toDestination: string;
  departureAt: Date;
  returnAt: Date;
  vehicleType: string;
  vehicleDetail: string;
  seatCount: number;
  pricePerSeat: number;
  hotelLinks: string;
  mealsIncluded: boolean;
  familyFriendly: boolean;
  tripStyle: string;
  published: boolean;
  agency: {
    id: string;
    businessName: string;
    status: string;
    reviews: { rating: number }[];
  };
  seats: { bookingId: string | null }[];
  media: { url: string; kind: string }[];
};

function num(value?: string) {
  if (!value) return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export function prismaTripWhere(input: TripSearchInput) {
  const from = CITIES.includes(input.from as (typeof CITIES)[number]) ? input.from : "";
  const to = (input.to || "").trim();
  const vehicle = VEHICLES.includes(input.vehicle as (typeof VEHICLES)[number]) ? input.vehicle : "";
  const minPrice = num(input.minPrice);
  const maxPrice = num(input.maxPrice);
  const date = input.date ? new Date(input.date) : null;
  const dateTo = input.dateTo ? new Date(input.dateTo) : null;

  return {
    published: true,
    departureAt: {
      gte: date && !Number.isNaN(date.getTime()) ? date : new Date(),
      ...(dateTo && !Number.isNaN(dateTo.getTime()) ? { lte: new Date(dateTo.getTime() + 86400000) } : {}),
    },
    agency: {
      status: "APPROVED" as const,
    },
    ...(from ? { fromCity: from } : {}),
    ...(to ? { toDestination: { contains: to } } : {}),
    ...(vehicle ? { vehicleType: vehicle } : {}),
    ...(minPrice ? { pricePerSeat: { gte: minPrice } } : {}),
    ...(maxPrice ? { pricePerSeat: { lte: maxPrice, ...(minPrice ? { gte: minPrice } : {}) } } : {}),
    ...(input.meals === "1" ? { mealsIncluded: true } : {}),
    ...(input.family === "1" ? { familyFriendly: true } : {}),
    ...(input.style ? { tripStyle: input.style } : {}),
  };
}

export function durationDays(trip: { departureAt: Date; returnAt: Date }) {
  return Math.max(1, Math.round((trip.returnAt.getTime() - trip.departureAt.getTime()) / 86400000));
}

export function agencyRating(reviews: { rating: number }[]) {
  if (!reviews.length) return 0;
  return reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
}

export function filterAndSortTrips(trips: PublicTrip[], input: TripSearchInput) {
  const minDuration = num(input.minDuration);
  const maxDuration = num(input.maxDuration);
  const minSeats = num(input.seats);
  const minRating = num(input.rating);
  const q = (input.q || "").trim().toLowerCase();

  let rows = trips.filter((trip) => {
    const left = trip.seats.filter((s) => !s.bookingId).length;
    const days = durationDays(trip);
    const rating = agencyRating(trip.agency.reviews);
    const hotels = parseHotelLinks(trip.hotelLinks);
    if (input.hotel === "1" && !hotels.length) return false;
    if (minDuration && days < minDuration) return false;
    if (maxDuration && days > maxDuration) return false;
    if (minSeats && left < minSeats) return false;
    if (input.verified === "1" && trip.agency.status !== "APPROVED") return false;
    if (minRating && rating < minRating) return false;
    if (q) {
      const hay = `${trip.title} ${trip.fromCity} ${trip.toDestination} ${trip.agency.businessName} ${trip.vehicleType}`.toLowerCase();
      const under = q.match(/under\s*(?:rs\.?\s*)?(\d+)/);
      if (under && trip.pricePerSeat > Number(under[1])) return false;
      const fromTo = q.match(/(.+)\s+to\s+(.+)/);
      if (fromTo) {
        const a = fromTo[1].trim();
        const b = fromTo[2].trim();
        if (!trip.fromCity.toLowerCase().includes(a) || !trip.toDestination.toLowerCase().includes(b)) {
          return hay.includes(q);
        }
      } else if (!hay.includes(q) && !under) {
        return false;
      }
    }
    return true;
  });

  const sort = input.sort || "recommended";
  rows = [...rows].sort((a, b) => {
    const leftA = a.seats.filter((s) => !s.bookingId).length;
    const leftB = b.seats.filter((s) => !s.bookingId).length;
    const rateA = agencyRating(a.agency.reviews);
    const rateB = agencyRating(b.agency.reviews);
    const valueA = a.pricePerSeat / durationDays(a);
    const valueB = b.pricePerSeat / durationDays(b);
    if (sort === "price_asc") return a.pricePerSeat - b.pricePerSeat;
    if (sort === "price_desc") return b.pricePerSeat - a.pricePerSeat;
    if (sort === "rating") return rateB - rateA;
    if (sort === "seats") return leftB - leftA;
    if (sort === "soonest") return a.departureAt.getTime() - b.departureAt.getTime();
    if (sort === "value") return valueA - valueB;
    return a.departureAt.getTime() - b.departureAt.getTime() || rateB - rateA;
  });
  return rows;
}

export function searchSummary(input: TripSearchInput, count: number) {
  const from = input.from || "";
  const to = input.to || "";
  if (from && to) return `${count} trip${count === 1 ? "" : "s"} found for ${from} → ${to}`;
  if (from) return `${count} trip${count === 1 ? "" : "s"} found from ${from}`;
  if (to) return `${count} trip${count === 1 ? "" : "s"} found to ${to}`;
  if (input.q) return `${count} trip${count === 1 ? "" : "s"} found`;
  return `${count} trip${count === 1 ? "" : "s"}`;
}
