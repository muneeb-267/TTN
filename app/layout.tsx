import type { Metadata } from "next";
import { Cormorant_Garamond, Figtree, Noto_Nastaliq_Urdu } from "next/font/google";
import { getLocale } from "@/lib/i18n";
import "./globals.css";

const display = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
});

const ui = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ui",
});

const urdu = Noto_Nastaliq_Urdu({
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-urdu",
});

export const metadata: Metadata = {
  title: "TTN — Travel To North",
  description:
    "Compare northern Pakistan group tours by agency, date, vehicle and live cinema-style seats.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();
  return (
    <html
      lang={locale === "ur" ? "ur" : "en"}
      dir={locale === "ur" ? "rtl" : "ltr"}
      className={`${display.variable} ${ui.variable} ${urdu.variable} h-full`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
