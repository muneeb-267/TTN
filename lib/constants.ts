export const PLATFORM_FEE_RATE = 0.05;
export const DEPOSIT_RATE = 0.5;
export const MIN_DAYS_FOR_DEPOSIT = 6;
export const LATE_CANCEL_PLATFORM_SHARE = 0.15;
export const LATE_CANCEL_AGENCY_SHARE = 0.15;
export const LATE_CANCEL_TRAVELER_SHARE = 0.2;
export const MIN_WHATSAPP_REVIEWS = 20;
export const MIN_CLIENT_PHONES = 5;
export const MIN_CNIC_PHOTOS = 2;
export const MIN_PREVIOUS_PHOTOS = 5;

export const CITIES = [
  "Karachi",
  "Lahore",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Gujranwala",
  "Sialkot",
] as const;

export const DESTINATIONS = [
  "Hunza",
  "Skardu",
  "Hunza & Skardu",
  "Naran & Kaghan",
  "Swat & Kalam",
  "Fairy Meadows",
  "Neelum Valley",
  "Deosai",
  "Khunjerab Pass",
  "Kalash Valley",
] as const;

export const VEHICLES = [
  "Coaster",
  "Grand Cabin",
  "Hiace",
  "Saloon Coaster",
  "Jeep 4x4",
] as const;

export const PAYMENT_METHODS = [
  { id: "jazzcash", label: "JazzCash" },
  { id: "easypaisa", label: "EasyPaisa" },
  { id: "card", label: "Debit / Credit card" },
  { id: "bank", label: "Bank transfer" },
] as const;
