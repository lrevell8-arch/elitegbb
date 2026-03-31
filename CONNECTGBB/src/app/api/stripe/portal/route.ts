import { NextResponse } from "next/server";
import Stripe from "stripe";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Stripe secret key not configured." }, { status: 500 });
  }

  const { customerId, returnUrl } = await request.json();

  if (!customerId || !returnUrl) {
    return NextResponse.json({ error: "Missing required portal parameters." }, { status: 400 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" });

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });

  return NextResponse.json({ url: portalSession.url });
}
