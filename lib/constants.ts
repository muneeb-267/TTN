/** Defaults only. Live rates come from PlatformSettings (basis points). */
export const DEFAULT_COMMISSION_BPS = 250;
export const DEFAULT_DEPOSIT_BPS = 5000;
export const DEFAULT_SEAT_HOLD_MINUTES = 10;
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
export const MIN_PASSWORD_LENGTH = 8;
export const COMPLAINTS_EMAIL = "complaints@ttn.pk";
export const SOCIAL_LINKS = {
  instagram: "https://www.instagram.com/traveltonorth",
  facebook: "https://www.facebook.com/traveltonorth",
  twitter: "https://x.com/traveltonorth",
} as const;
export const REFUND_WINDOW_HOURS = 24;
export const PAYMENT_HOLD_MINUTES = 10;
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
  "Naran",
  "Kaghan",
  "Naran & Kaghan",
  "Swat",
  "Swat & Kalam",
  "Kumrat",
  "Fairy Meadows",
  "Neelum Valley",
  "Chitral",
  "Murree",
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
    blurb: "IBFT or Raast to the listed IBAN. Copy the amount and booking ref, then upload the receipt screenshot.",
  },
  {
    id: "easypaisa",
    label: "EasyPaisa",
    blurb: "Send Money in EasyPaisa to the listed wallet. Paste TID + screenshot — same flow as other Pakistani travel checkouts.",
  },
  {
    id: "jazzcash",
    label: "JazzCash",
    blurb: "Hosted JazzCash when merchant keys are live; otherwise Send Money to the listed wallet, then TID + screenshot.",
  },
  {
    id: "card",
    label: "Visa / Mastercard",
    blurb: "Pay by debit or credit card on Stripe’s hosted checkout. Confirmed automatically.",
  },
] as const;
