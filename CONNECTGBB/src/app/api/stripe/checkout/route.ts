import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe secret key not configured." }, { status: 500 });
  }

  const { priceId, successUrl, cancelUrl, customerId, customerEmail, memberId } =
    await request.json();

  if (!priceId || !successUrl || !cancelUrl) {
    return NextResponse.json({ error: "Missing required checkout parameters." }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" });

  let resolvedCustomerId = customerId as string | undefined;

  if (!resolvedCustomerId && customerEmail) {
    const customer = await stripe.customers.create({ email: customerEmail });
    resolvedCustomerId = customer.id;
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    customer: resolvedCustomerId,
    allow_promotion_codes: true,
    metadata: memberId ? { memberId } : undefined,
    subscription_data: memberId ? { metadata: { memberId } } : undefined,
  });

  return NextResponse.json({ url: session.url });
}
