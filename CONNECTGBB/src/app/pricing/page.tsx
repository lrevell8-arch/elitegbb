"use client";

import { useState } from "react";
import PageLayout from "@/components/PageLayout";
import { MEMBERSHIP_TIERS } from "@/lib/stripe";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function PricingPage() {
  const { profile } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [loadingTier, setLoadingTier] = useState<string | null>(null);

  const handleCheckout = async (tierKey: string, priceId: string | null) => {
    if (!priceId) {
      setStatus("Stripe price ID not configured for this tier.");
      return;
    }
    if (!profile) {
      setStatus("Sign in and complete onboarding before upgrading.");
      return;
    }

    setLoadingTier(tierKey);
    setStatus(null);

    let supabase;

    try {
      supabase = getSupabaseClient();
    } catch (error) {
      setStatus("Supabase client not configured.");
      setLoadingTier(null);
      return;
    }

    const { data: membership } = await supabase
      .from("memberships")
      .select("stripe_customer_id")
      .eq("member_id", profile.id)
      .maybeSingle();

    const response = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        priceId,
        successUrl: window.location.origin + "/billing?success=1",
        cancelUrl: window.location.origin + "/pricing?canceled=1",
        customerId: membership?.stripe_customer_id,
        customerEmail: profile.email,
        memberId: profile.id,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Unable to start checkout.");
      setLoadingTier(null);
      return;
    }

    if (payload.url) {
      window.location.href = payload.url as string;
    }
  };

  return (
    <PageLayout
      title="Membership Plans"
      subtitle="Choose the plan that matches your training and recruiting goals. Monthly and annual billing will be supported via Stripe."
      eyebrow="Pricing"
    >
      <section className="grid gap-6 md:grid-cols-3">
        {MEMBERSHIP_TIERS.map((tier) => (
          <div key={tier.key} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0134bd]">
              {tier.label}
            </p>
            <p className="mt-3 text-sm text-white/70">{tier.description}</p>
            <button
              type="button"
              disabled={!tier.priceId || loadingTier === tier.key}
              onClick={() => handleCheckout(tier.key, tier.priceId)}
              className="mt-5 w-full rounded-full bg-[#0134bd] px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
            >
              {tier.key === "free" ? "Free Access" : loadingTier === tier.key ? "Loading..." : "Start"}
            </button>
            {tier.priceId ? null : (
              <p className="mt-2 text-xs text-white/50">Price ID required to enable checkout.</p>
            )}
          </div>
        ))}
      </section>
      {status ? <p className="text-sm text-white/60">{status}</p> : null}
      <section className="rounded-2xl border border-white/10 bg-black/60 p-6">
        <h2 className="text-xl font-semibold text-white">Billing options</h2>
        <p className="mt-2 text-sm text-white/70">
          Stripe will power subscriptions, trials, and family/team bundles. Annual plans include a 15%
          discount and priority onboarding.
        </p>
      </section>
    </PageLayout>
  );
}
