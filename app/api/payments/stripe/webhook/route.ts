import { NextResponse } from "next/server";
import { getStripe } from "@/lib/stripe";
import { confirmPayment } from "@/lib/payments";
import { syncConnectAccountByStripeId } from "@/lib/connect";

function accountIdFromEvent(event: { type: string; account?: string; data: { object: unknown } }) {
  if (event.account) return event.account;
  const object = event.data.object as { id?: string };
  const id = object?.id || "";
  if (id.startsWith("acct_") || (event.type.includes("account") && id)) return id;
  return "";
}

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
  if (
    event.type === "account.updated" ||
    event.type === "capability.updated" ||
    event.type.startsWith("v2.core.account")
  ) {
    const accountId = accountIdFromEvent(event);
    if (accountId) await syncConnectAccountByStripeId(accountId);
  }
  return NextResponse.json({ received: true });
}
