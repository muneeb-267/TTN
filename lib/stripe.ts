import Stripe from "stripe";
import { appBaseUrl, integrationSuffix } from "./payments";

let client: Stripe | null = null;

export function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!client) {
    client = new Stripe(key, { apiVersion: "2026-07-29.dahlia" });
  }
  return client;
}

export async function createCardCheckout(input: {
  paymentId: string;
  bookingId: string;
  bookingRef: string;
  title: string;
  amountPkr: number;
}) {
  const stripe = getStripe();
  if (!stripe) throw new Error("Card payments are not live yet. Add STRIPE_SECRET_KEY.");
  const base = await appBaseUrl();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    success_url: `${base}/traveler/bookings/${input.bookingId}/pay?stripe=1&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${base}/traveler/bookings/${input.bookingId}/pay?cancelled=1`,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "pkr",
          unit_amount: Math.round(input.amountPkr * 100),
          product_data: {
            name: `TTN ${input.bookingRef}`,
            description: input.title,
          },
        },
      },
    ],
    metadata: {
      paymentId: input.paymentId,
      bookingId: input.bookingId,
    },
    integration_identifier: `ttn_pay_${integrationSuffix()}`,
  });
  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return session;
}
