"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/components/AuthProvider";
import { ROLE_LABELS, type RoleKey } from "@/lib/roles";
import { MEMBERSHIP_TIERS } from "@/lib/stripe";
import { getSupabaseClient } from "@/lib/supabaseClient";

const onboardingSteps = [
  "Select role + level",
  "Set training + recruiting goals",
  "Claim or create profile",
  "Choose membership tier",
];

const roleOptions: RoleKey[] = ["player", "parent", "coach", "organizer"];

export default function OnboardingPage() {
  const { user, profile, loading, refreshProfile } = useAuth();
  const [role, setRole] = useState<RoleKey>("player");
  const [displayName, setDisplayName] = useState("");
  const [tier, setTier] = useState<"free" | "development" | "elite">("free");
  const [status, setStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (user?.email) {
      setDisplayName(user.user_metadata?.full_name || "");
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!user) {
      setStatus("Please sign in before completing onboarding.");
      return;
    }

    if (!displayName) {
      setStatus("Add a display name to continue.");
      return;
    }

    setSubmitting(true);
    setStatus(null);

    let supabase;

    try {
      supabase = getSupabaseClient();
    } catch (error) {
      setStatus("Supabase client not configured.");
      setSubmitting(false);
      return;
    }

    const { data: profileData, error: profileError } = await supabase
      .from("member_profiles")
      .insert({
        auth_user_id: user.id,
        role,
        display_name: displayName,
        email: user.email,
      })
      .select("id")
      .single();

    if (profileError) {
      setStatus(profileError.message);
      setSubmitting(false);
      return;
    }

    const membershipStatus = tier === "free" ? "active" : "trialing";
    const trialEnd = tier === "free" ? null : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

    const { error: membershipError } = await supabase.from("memberships").insert({
      member_id: profileData.id,
      tier,
      status: membershipStatus,
      billing_cycle: "monthly",
      trial_end: trialEnd ? trialEnd.toISOString() : null,
    });

    if (membershipError) {
      setStatus(membershipError.message);
      setSubmitting(false);
      return;
    }

    await refreshProfile();
    setStatus("Profile created! Visit your dashboard to continue.");
    setSubmitting(false);
  };

  return (
    <PageLayout
      title="Onboarding"
      subtitle="Collect role, level, and goals to personalize training and recruiting recommendations."
      eyebrow="Get Started"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Onboarding flow</h2>
        <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
          {onboardingSteps.map((step) => (
            <div key={step} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
              {step}
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
          <h2 className="text-lg font-semibold text-white">Create your member profile</h2>
          {loading ? (
            <p className="mt-3 text-sm text-white/70">Loading session...</p>
          ) : null}
          {!loading && !user ? (
            <p className="mt-3 text-sm text-white/70">
              You&apos;ll need to <Link href="/login" className="text-[#fb6c1d]">sign in</Link> first.
            </p>
          ) : null}
          {!loading && user ? (
            <div className="mt-4 space-y-3 text-sm text-white/70">
              <label className="flex flex-col gap-2">
                Display name
                <input
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </label>
              <label className="flex flex-col gap-2">
                Role
                <select
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                  value={role}
                  onChange={(event) => setRole(event.target.value as RoleKey)}
                >
                  {roleOptions.map((option) => (
                    <option key={option} value={option}>
                      {ROLE_LABELS[option]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-2">
                Membership tier
                <select
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white outline-none"
                  value={tier}
                  onChange={(event) => setTier(event.target.value as "free" | "development" | "elite")}
                >
                  {MEMBERSHIP_TIERS.map((tierOption) => (
                    <option key={tierOption.key} value={tierOption.key}>
                      {tierOption.label}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !!profile}
                className="rounded-full bg-[#0134bd] px-4 py-2 text-sm font-semibold text-white"
              >
                {profile ? "Profile already created" : submitting ? "Saving..." : "Create profile"}
              </button>
              {status ? <p className="text-xs text-white/60">{status}</p> : null}
            </div>
          ) : null}
        </div>

        <div className="rounded-2xl border border-white/10 bg-black/60 p-6">
          <h2 className="text-lg font-semibold text-white">What happens next</h2>
          <ul className="mt-4 space-y-2 text-sm text-white/70">
            <li className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">Verify your profile details</li>
            <li className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">Claim or build your player profile</li>
            <li className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">Start training and save playlists</li>
          </ul>
        </div>
      </section>
    </PageLayout>
  );
}
