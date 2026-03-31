import { NextResponse } from "next/server";
import Stripe from "stripe";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export async function POST(request: Request) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhook not configured." }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey, { apiVersion: "2025-02-24.acacia" });
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing stripe signature." }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (error) {
    return NextResponse.json({ error: "Invalid webhook signature." }, { status: 400 });
  }

  if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
    const subscription = event.data.object as Stripe.Subscription;
    const customerId = subscription.customer as string;
    const priceId = subscription.items.data[0]?.price?.id;
    const memberId = subscription.metadata?.memberId || null;
    const status = subscription.status;

    const tier = priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_ELITE
      ? "elite"
      : priceId === process.env.NEXT_PUBLIC_STRIPE_PRICE_ID_DEVELOPMENT
        ? "development"
        : "free";

    const payload = {
      tier,
      status,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscription.id,
      current_period_end: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000).toISOString()
        : null,
    };

    const { data: existingMembership } = await supabaseAdmin
      .from("memberships")
      .select("id")
      .eq("stripe_customer_id", customerId)
      .maybeSingle();

    if (existingMembership?.id) {
      await supabaseAdmin.from("memberships").update(payload).eq("id", existingMembership.id);
    } else if (memberId) {
      await supabaseAdmin.from("memberships").insert({
        member_id: memberId,
        billing_cycle: "monthly",
        ...payload,
      });
    }
  }

  return NextResponse.json({ received: true });
}
