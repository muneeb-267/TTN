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
export const COMPLAINTS_EMAIL = "complaints@ttn.pk";
export const REFUND_WINDOW_HOURS = 24;
export const PAYMENT_HOLD_MINUTES = 45;

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
    id: "jazzcash",
    label: "JazzCash",
    blurb: "Send PKR from the JazzCash app to TTN’s merchant wallet, or open JazzCash hosted checkout when merchant keys are live.",
  },
  {
    id: "easypaisa",
    label: "EasyPaisa",
    blurb: "Send PKR from EasyPaisa to TTN’s merchant wallet. Use your booking ref in the message.",
  },
  {
    id: "bank",
    label: "Bank / Raast",
    blurb: "IBFT or Raast to TTN’s bank account. Put the booking ref in the transfer narration.",
  },
  {
    id: "card",
    label: "Visa / Mastercard",
    blurb: "Pay by debit or credit card on Stripe’s hosted checkout. PKR, cards issued in Pakistan and abroad.",
  },
] as const;
