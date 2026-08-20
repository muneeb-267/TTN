/**
 * Future TTN AI assistant must only recommend rows from the live database.
 * It must never invent prices, seats, dates, agencies or availability.
 */
export async function recommendTripsFromQuery(_query: string) {
  throw new Error("AI search is not enabled. Use structured filters on /trips.");
}
