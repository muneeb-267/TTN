import { cookies } from "next/headers";

export type Locale = "en" | "ur";

const dict = {
  en: {
    brand: "TTN",
    brandFull: "Travel To North",
    tagline: "Every northbound trip. Real seats. Real dates.",
    chooseRole: "How do you want to enter?",
    traveler: "Traveler",
    agency: "Agency",
    travelerBlurb: "Find group tours to Hunza, Skardu, Naran and Swat. Pick your seat like a cinema, pay half to lock it.",
    agencyBlurb: "Post departures, vehicle, dates and seat maps. Get bookings from Karachi, Lahore, Islamabad and beyond.",
    explore: "Explore trips",
    signIn: "Sign in",
    signUp: "Create account",
    signOut: "Sign out",
    from: "From",
    to: "To",
    when: "Departure",
    vehicle: "Vehicle",
    seatsLeft: "seats left",
    book: "Select seats",
    deposit: "Pay 50% now",
    remaining: "Remaining due 1 day before departure",
    comments: "Trip comments",
    reviews: "Traveler reviews",
    hotels: "Stay",
    dashboard: "Dashboard",
    myBookings: "My bookings",
    postTrip: "Post a trip",
    gallery: "Gallery",
    rules: "Rules",
    follow: "Follow",
    contact: "Contact",
    pendingAgency: "Your agency is waiting for TTN approval. WhatsApp reviews, two CNICs and five client numbers are required.",
    english: "EN",
    urdu: "اردو",
  },
  ur: {
    brand: "TTN",
    brandFull: "ٹریول ٹو نارتھ",
    tagline: "شمال کی ہر سفر۔ اصلی سیٹیں، اصلی تاریخیں۔",
    chooseRole: "آپ کیسے داخل ہونا چاہتے ہیں؟",
    traveler: "مسافر",
    agency: "ایجنسی",
    travelerBlurb: "ہنزہ، سکردو، ناران اور سوات کے گروپ ٹور تلاش کریں۔ سینما کی طرح سیٹ چنیں، آدھی رقم دے کر سیٹ بک کریں۔",
    agencyBlurb: "روانگی، گاڑی، تاریخیں اور سیٹ میپ لگائیں۔ کراچی، لاہور، اسلام آباد سے بکنگ حاصل کریں۔",
    explore: "سفر دیکھیں",
    signIn: "سائن ان",
    signUp: "اکاؤنٹ بنائیں",
    signOut: "سائن آؤٹ",
    from: "سے",
    to: "تک",
    when: "روانگی",
    vehicle: "گاڑی",
    seatsLeft: "سیٹیں باقی",
    book: "سیٹ منتخب کریں",
    deposit: "ابھی 50٪ ادا کریں",
    remaining: "بقیہ رقم روانگی سے ایک دن پہلے",
    comments: "سفر پر تبصرے",
    reviews: "مسافروں کے ریویوز",
    hotels: "قیام",
    dashboard: "ڈیش بورڈ",
    myBookings: "میری بکنگز",
    postTrip: "سفر لگائیں",
    gallery: "گیلری",
    rules: "قواعد",
    follow: "فالو کریں",
    contact: "رابطہ",
    pendingAgency: "آپ کی ایجنسی منظوری کی منتظر ہے۔ واٹس ایپ ریویوز، دو شناختی کارڈ اور پانچ کلائنٹ نمبرز درکار ہیں۔",
    english: "EN",
    urdu: "اردو",
  },
} as const;

export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  return store.get("ttn_lang")?.value === "ur" ? "ur" : "en";
}

export function t(locale: Locale) {
  return dict[locale];
}
