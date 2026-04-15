"use client";

import { useEffect, useState } from "react";
import PageLayout from "@/components/PageLayout";
import { MEMBERSHIP_TIERS } from "@/lib/stripe";
import { useAuth } from "@/components/AuthProvider";
import { getSupabaseClient } from "@/lib/supabaseClient";

export default function BillingPage() {
  const { profile } = useAuth();
  const [status, setStatus] = useState<string | null>(null);
  const [customerId, setCustomerId] = useState("");
  const [membershipTier, setMembershipTier] = useState<string | null>(null);
  const [membershipStatus, setMembershipStatus] = useState<string | null>(null);

  useEffect(() => {
    const loadMembership = async () => {
      if (!profile) {
        return;
      }

      let supabase;

      try {
        supabase = getSupabaseClient();
      } catch (error) {
        return;
      }

      const { data } = await supabase
        .from("memberships")
        .select("stripe_customer_id, tier, status")
        .eq("member_id", profile.id)
        .maybeSingle();
      if (data?.stripe_customer_id) {
        setCustomerId(data.stripe_customer_id);
      }
      setMembershipTier(data?.tier ?? null);
      setMembershipStatus(data?.status ?? null);
    };

    loadMembership();
  }, [profile]);

  const openPortal = async () => {
    setStatus(null);
    const response = await fetch("/api/stripe/portal", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customerId, returnUrl: window.location.origin + "/billing" }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setStatus(payload.error || "Unable to open Stripe portal.");
      return;
    }

    if (payload.url) {
      window.location.href = payload.url as string;
    }
  };

  return (
    <PageLayout
      title="Billing & Membership"
      subtitle="Manage your Stripe subscription, billing cycle, and membership tier."
      eyebrow="Billing"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Current membership</h2>
        <p className="mt-2 text-sm text-white/70">
          {membershipTier ? `Tier: ${membershipTier}` : "No tier on file yet."} {membershipStatus ? `· ${membershipStatus}` : ""}
        </p>
      </section>
      <section className="grid gap-4 md:grid-cols-3">
        {MEMBERSHIP_TIERS.map((tier) => (
          <div key={tier.key} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0134bd]">
              {tier.label}
            </p>
            <p className="mt-3 text-sm text-white/70">{tier.description}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-white/10 bg-black/60 p-6">
        <h2 className="text-lg font-semibold text-white">Stripe customer portal</h2>
        <p className="mt-2 text-sm text-white/70">
          This button will open the Stripe customer portal once the member&apos;s customer ID is stored.
        </p>
        <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center">
          <input
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none md:max-w-sm"
            placeholder="Stripe customer ID"
            value={customerId}
            onChange={(event) => setCustomerId(event.target.value)}
          />
          <button
            type="button"
            onClick={openPortal}
            className="rounded-full bg-[#0134bd] px-4 py-2 text-sm font-semibold text-white"
          >
            Manage subscription
          </button>
        </div>
        {status ? <p className="mt-3 text-xs text-white/60">{status}</p> : null}
      </section>
    </PageLayout>
  );
}
