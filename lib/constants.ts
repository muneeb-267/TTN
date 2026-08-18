export const PLATFORM_FEE_RATE = 0.025;
export const PLATFORM_FEE_LABEL = "2.5%";
export const DEPOSIT_RATE = 0.5;
export const MIN_DAYS_FOR_DEPOSIT = 6;
export const LATE_CANCEL_PLATFORM_SHARE = 0.15;
export const LATE_CANCEL_AGENCY_SHARE = 0.15;
export const LATE_CANCEL_TRAVELER_SHARE = 0.2;
export const MIN_WHATSAPP_REVIEWS = 20;
export const MIN_CLIENT_PHONES = 5;
export const MIN_CNIC_PHOTOS = 2;
export const MIN_PREVIOUS_PHOTOS = 5;
export const COMPLAINTS_EMAIL = "complaints@ttn.pk";
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/traveltonorth",
  facebook: "https://www.facebook.com/traveltonorth",
  twitter: "https://x.com/traveltonorth",
} as const;
export const REFUND_WINDOW_HOURS = 24;
export const PAYMENT_HOLD_MINUTES = 45;
export const PLATFORM_FEE_GRACE_DAYS = 2;
export const PLATFORM_FEE_DELIST_DAYS = 2;

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
  {
    id: "bank",
    label: "Bank / Raast",
    blurb: "Main option. IBFT or Raast to the agency’s bank account. Put the booking ref in the narration.",
  },
  {
    id: "easypaisa",
    label: "EasyPaisa",
    blurb: "Optional. Send PKR from EasyPaisa to the agency’s wallet if they listed one.",
  },
  {
    id: "jazzcash",
    label: "JazzCash",
    blurb: "Optional. Send PKR from JazzCash to the agency’s wallet if they listed one.",
  },
  {
    id: "card",
    label: "Visa / Mastercard",
    blurb: "Pay by debit or credit card on Stripe’s hosted checkout.",
  },
] as const;
