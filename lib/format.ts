export function pkr(amount: number) {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDateTime(date: Date, locale: "en" | "ur" = "en") {
  return new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-PK", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(date: Date, locale: "en" | "ur" = "en") {
  return new Intl.DateTimeFormat(locale === "ur" ? "ur-PK" : "en-PK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(date);
}

export function daysUntil(date: Date) {
  const ms = date.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function startOfDay(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isWithinHours(from: Date, hours: number, now = new Date()) {
  return now.getTime() - from.getTime() < hours * 60 * 60 * 1000;
}

export function parseHotelLinks(raw: string): { name: string; url: string; rooms?: string }[] {
  try {
    const value = JSON.parse(raw) as { name: string; url?: string; rooms?: string }[];
    return Array.isArray(value)
      ? value
          .filter((h) => h && h.name)
          .map((h) => ({ name: h.name, url: h.url || "", rooms: h.rooms || "" }))
      : [];
  } catch {
    return [];
  }
}

export function toDatetimeLocal(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
