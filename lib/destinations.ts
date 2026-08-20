function unsplash(id: string, width = 1400) {
  return `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${width}&q=80`;
}

type Place = {
  name: string;
  query: string;
  image: string;
  gallery: string[];
};

const PLACES: Record<string, Place> = {
  hunza: {
    name: "Hunza",
    query: "Hunza",
    image: unsplash("photo-1689388259449-9dd3a333d09d"),
    gallery: [
      unsplash("photo-1689388259449-9dd3a333d09d"),
      unsplash("photo-1632133915653-8ded5c72e329"),
      unsplash("photo-1684230715200-40f32e068bf2"),
      unsplash("photo-1722082933604-288a1c130475"),
    ],
  },
  skardu: {
    name: "Skardu",
    query: "Skardu",
    image: unsplash("photo-1506905925346-21bda4d32df4"),
    gallery: [
      unsplash("photo-1506905925346-21bda4d32df4"),
      unsplash("photo-1464822759023-fed622ff2c3b"),
      unsplash("photo-1632133915653-8ded5c72e329", 1200),
      unsplash("photo-1722082933604-288a1c130475", 1200),
    ],
  },
  naran: {
    name: "Naran",
    query: "Naran",
    image: unsplash("photo-1501785888041-af3ef285b470"),
    gallery: [
      unsplash("photo-1501785888041-af3ef285b470"),
      unsplash("photo-1432405972610-b9c1d3d4c62f"),
      unsplash("photo-1500530855697-b586d89ba3ee"),
      unsplash("photo-1470071459604-3b5ec3a7fe05"),
    ],
  },
  kaghan: {
    name: "Kaghan",
    query: "Kaghan",
    image: unsplash("photo-1470071459604-3b5ec3a7fe05"),
    gallery: [
      unsplash("photo-1470071459604-3b5ec3a7fe05"),
      unsplash("photo-1501785888041-af3ef285b470", 1200),
      unsplash("photo-1432405972610-b9c1d3d4c62f", 1200),
      unsplash("photo-1441974231531-c6227db76b6e"),
    ],
  },
  swat: {
    name: "Swat",
    query: "Swat",
    image: unsplash("photo-1441974231531-c6227db76b6e"),
    gallery: [
      unsplash("photo-1441974231531-c6227db76b6e"),
      unsplash("photo-1470071459604-3b5ec3a7fe05", 1200),
      unsplash("photo-1500534314209-a25ddb2bd429"),
      unsplash("photo-1472214103451-9374bd1c798e"),
    ],
  },
  kalam: {
    name: "Kalam",
    query: "Swat & Kalam",
    image: unsplash("photo-1500534314209-a25ddb2bd429"),
    gallery: [
      unsplash("photo-1500534314209-a25ddb2bd429"),
      unsplash("photo-1441974231531-c6227db76b6e", 1200),
      unsplash("photo-1472214103451-9374bd1c798e"),
      unsplash("photo-1470071459604-3b5ec3a7fe05", 1200),
    ],
  },
  kumrat: {
    name: "Kumrat",
    query: "Kumrat",
    image: unsplash("photo-1441974231531-c6227db76b6e", 1600),
    gallery: [
      unsplash("photo-1441974231531-c6227db76b6e", 1600),
      unsplash("photo-1500530855697-b586d89ba3ee"),
      unsplash("photo-1472214103451-9374bd1c798e"),
      unsplash("photo-1470071459604-3b5ec3a7fe05"),
    ],
  },
  "fairy meadows": {
    name: "Fairy Meadows",
    query: "Fairy Meadows",
    image: unsplash("photo-1664872772950-548bc7bfdf32"),
    gallery: [
      unsplash("photo-1664872772950-548bc7bfdf32"),
      unsplash("photo-1486870591958-9b9d0d1dda99"),
      unsplash("photo-1464822759023-fed622ff2c3b"),
      unsplash("photo-1506905925346-21bda4d32df4", 1200),
    ],
  },
  neelum: {
    name: "Neelum Valley",
    query: "Neelum Valley",
    image: unsplash("photo-1500530855697-b586d89ba3ee"),
    gallery: [
      unsplash("photo-1500530855697-b586d89ba3ee"),
      unsplash("photo-1441974231531-c6227db76b6e"),
      unsplash("photo-1472214103451-9374bd1c798e"),
      unsplash("photo-1501785888041-af3ef285b470", 1200),
    ],
  },
  chitral: {
    name: "Chitral",
    query: "Chitral",
    image: unsplash("photo-1500534314209-a25ddb2bd429"),
    gallery: [
      unsplash("photo-1500534314209-a25ddb2bd429"),
      unsplash("photo-1470071459604-3b5ec3a7fe05"),
      unsplash("photo-1486870591958-9b9d0d1dda99"),
      unsplash("photo-1664872772950-548bc7bfdf32", 1200),
    ],
  },
  kalash: {
    name: "Kalash Valley",
    query: "Kalash Valley",
    image: unsplash("photo-1500534314209-a25ddb2bd429", 1600),
    gallery: [
      unsplash("photo-1500534314209-a25ddb2bd429", 1600),
      unsplash("photo-1470071459604-3b5ec3a7fe05"),
      unsplash("photo-1472214103451-9374bd1c798e"),
      unsplash("photo-1441974231531-c6227db76b6e"),
    ],
  },
  murree: {
    name: "Murree",
    query: "Murree",
    image: unsplash("photo-1472214103451-9374bd1c798e"),
    gallery: [
      unsplash("photo-1472214103451-9374bd1c798e"),
      unsplash("photo-1441974231531-c6227db76b6e"),
      unsplash("photo-1470071459604-3b5ec3a7fe05"),
      unsplash("photo-1500530855697-b586d89ba3ee"),
    ],
  },
  deosai: {
    name: "Deosai",
    query: "Deosai",
    image: unsplash("photo-1464822759023-fed622ff2c3b"),
    gallery: [
      unsplash("photo-1464822759023-fed622ff2c3b"),
      unsplash("photo-1506905925346-21bda4d32df4"),
      unsplash("photo-1486870591958-9b9d0d1dda99"),
      unsplash("photo-1664872772950-548bc7bfdf32", 1200),
    ],
  },
  khunjerab: {
    name: "Khunjerab Pass",
    query: "Khunjerab Pass",
    image: unsplash("photo-1684230715200-40f32e068bf2"),
    gallery: [
      unsplash("photo-1684230715200-40f32e068bf2"),
      unsplash("photo-1632133915653-8ded5c72e329"),
      unsplash("photo-1464822759023-fed622ff2c3b"),
      unsplash("photo-1506905925346-21bda4d32df4"),
    ],
  },
};

const CITIES: Record<string, string> = {
  islamabad: unsplash("photo-1587474260584-196eb9e3ad1f"),
  rawalpindi: unsplash("photo-1587474260584-196eb9e3ad1f", 1200),
  lahore: unsplash("photo-1564507592333-c60657eea813"),
  karachi: unsplash("photo-1507525428034-b723cf961d3e"),
  peshawar: unsplash("photo-1477959858617-67f85cf4f1df"),
  faisalabad: unsplash("photo-1477959858617-67f85cf4f1df", 1200),
  multan: unsplash("photo-1477959858617-67f85cf4f1df", 1000),
  quetta: unsplash("photo-1464822759023-fed622ff2c3b", 1000),
  gujranwala: unsplash("photo-1477959858617-67f85cf4f1df", 900),
  sialkot: unsplash("photo-1477959858617-67f85cf4f1df", 800),
};

const PLACE_ORDER = [
  "fairy meadows",
  "neelum",
  "khunjerab",
  "kalash",
  "deosai",
  "kumrat",
  "kaghan",
  "naran",
  "skardu",
  "hunza",
  "kalam",
  "swat",
  "chitral",
  "murree",
] as const;

export const DISCOVER_DESTINATIONS = [
  PLACES.hunza,
  PLACES.skardu,
  PLACES.naran,
  PLACES.kaghan,
  PLACES.swat,
  PLACES.kumrat,
  PLACES["fairy meadows"],
  PLACES.neelum,
  PLACES.chitral,
  PLACES.murree,
].map((p) => ({ name: p.name, query: p.query, image: p.image }));

export function resolvePlace(name: string): Place {
  const n = name.toLowerCase();
  const key = PLACE_ORDER.find((k) => n.includes(k));
  return PLACES[key || "hunza"];
}

export function destinationImage(name: string) {
  return resolvePlace(name).image;
}

export function destinationGallery(name: string) {
  return resolvePlace(name).gallery;
}

export function cityImage(name: string) {
  const key = name.toLowerCase().trim();
  return CITIES[key] || CITIES.islamabad;
}

export const SCENE = {
  hunza: PLACES.hunza.image,
  passu: unsplash("photo-1632133915653-8ded5c72e329"),
  attabad: unsplash("photo-1689388259449-9dd3a333d09d"),
  karakoram: unsplash("photo-1506905925346-21bda4d32df4"),
  fairyMeadows: PLACES["fairy meadows"].image,
  naran: PLACES.naran.image,
  kkh: unsplash("photo-1684230715200-40f32e068bf2"),
  islamabad: CITIES.islamabad,
};

export function tripDurationNights(departureAt: Date, returnAt: Date) {
  const days = Math.max(1, Math.round((returnAt.getTime() - departureAt.getTime()) / (1000 * 60 * 60 * 24)));
  const nights = Math.max(0, days - 1);
  return { days, nights };
}
