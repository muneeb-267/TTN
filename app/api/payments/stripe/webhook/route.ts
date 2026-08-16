import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { confirmPayment } from "@/lib/payments";

export async function POST(req: Request) {
  const stripe = getStripe();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !secret) {
    return NextResponse.json({ error: "Stripe webhook is not configured." }, { status: 501 });
  }
  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature." }, { status: 400 });
  }
  const raw = await req.text();
  let event;
  try {
    event = stripe.webhooks.constructEvent(raw, signature, secret);
  } catch {
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const paymentId = session.metadata?.paymentId;
    if (paymentId && session.payment_status === "paid") {
      await confirmPayment(paymentId, {
        providerTxn: String(session.payment_intent || session.id),
      });
    }
  }
  return NextResponse.json({ received: true });
}
