export const DISCOVER_DESTINATIONS = [
  {
    name: "Hunza",
    query: "Hunza",
    image:
      "https://images.unsplash.com/photo-1587474260584-196eb9e3ad1f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Skardu",
    query: "Skardu",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Naran",
    query: "Naran",
    image:
      "https://images.unsplash.com/photo-1432405972610-b9c1d3d4c62f?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Kaghan",
    query: "Kaghan",
    image:
      "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Swat",
    query: "Swat",
    image:
      "https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Kumrat",
    query: "Kumrat",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Fairy Meadows",
    query: "Fairy Meadows",
    image:
      "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Neelum Valley",
    query: "Neelum Valley",
    image:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Chitral",
    query: "Chitral",
    image:
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1200&q=80",
  },
  {
    name: "Murree",
    query: "Murree",
    image:
      "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?auto=format&fit=crop&w=1200&q=80",
  },
] as const;

export function destinationImage(name: string) {
  const hit = DISCOVER_DESTINATIONS.find(
    (d) => name.toLowerCase().includes(d.name.toLowerCase()) || d.query.toLowerCase() === name.toLowerCase(),
  );
  return hit?.image || DISCOVER_DESTINATIONS[0].image;
}

export function tripDurationNights(departureAt: Date, returnAt: Date) {
  const days = Math.max(1, Math.round((returnAt.getTime() - departureAt.getTime()) / (1000 * 60 * 60 * 24)));
  const nights = Math.max(0, days - 1);
  return { days, nights };
}
