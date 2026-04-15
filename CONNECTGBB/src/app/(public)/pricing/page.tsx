"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EmptyState, ErrorState, MembershipBadge, SectionCard, SkeletonCard } from "@/components/ui";

type BillingCycle = "monthly" | "annual";

type Plan = {
  key: "free" | "player-pro" | "coach";
  name: string;
  monthly: string;
  annual: string;
  description: string;
  features: string[];
};

const plans: Plan[] = [
  {
    key: "free",
    name: "Free",
    monthly: "$0",
    annual: "$0",
    description: "Basic profile and starter access.",
    features: ["Profile claim", "Starter visibility", "Limited resources"],
  },
  {
    key: "player-pro",
    name: "Player Pro",
    monthly: "$29",
    annual: "$299",
    description: "Full development and recruiting toolkit.",
    features: ["Training hub access", "Progress tracking", "Enhanced visibility", "Priority support"],
  },
  {
    key: "coach",
    name: "Coach",
    monthly: "$49",
    annual: "$499",
    description: "Scouting and communication workflow access.",
    features: ["Advanced search", "Shortlist tools", "Trusted messaging", "Program profile controls"],
  },
];

const comparisonRows = [
  { feature: "Verified profile", free: "Yes", pro: "Yes", coach: "Program profile" },
  { feature: "Training library", free: "Limited", pro: "Full", coach: "N/A" },
  { feature: "Recruiting visibility", free: "Basic", pro: "Enhanced", coach: "Prospect discovery" },
  { feature: "Messaging tools", free: "No", pro: "Guided", coach: "Full" },
  { feature: "Support", free: "Community", pro: "Priority", coach: "Priority" },
];

const faqItems = [
  {
    question: "Can I change plans later?",
    answer: "Yes, membership can be upgraded or adjusted as your goals evolve.",
  },
  {
    question: "Do annual plans save money?",
    answer: "Annual billing provides the best value for year-round development.",
  },
  {
    question: "Is there a coach-only plan?",
    answer: "Yes, the Coach plan provides scouting tools, shortlisting, and trusted messaging.",
  },
];

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [loadError] = useState<string | null>(null);
  const [isLoading] = useState(false);

  const cards = useMemo(() => plans, []);

  if (loadError) {
    return <ErrorState title="Pricing load error" description="Unable to load membership options." />;
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Membership Plans" description="Choose the right plan for your role and goals.">
        <div className="flex gap-2">
          {(["monthly", "annual"] as BillingCycle[]).map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCycle(c)}
              className={`rounded-md px-3 py-1.5 text-sm ${cycle === c ? "bg-[var(--brand-primary)] text-white" : "border border-white/15 text-white/75"}`}
            >
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
      </SectionCard>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {[1, 2, 3].map((n) => <SkeletonCard key={n} />)}
        </div>
      ) : cards.length === 0 ? (
        <EmptyState title="No plans available" description="Check back soon for membership options." />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          {cards.map((plan) => (
            <article key={plan.key} className="rounded-xl border border-white/10 bg-[var(--surface)] p-5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-white">{plan.name}</p>
                <MembershipBadge tier={plan.key} />
              </div>
              <p className="mt-3 text-2xl font-bold text-white">
                {cycle === "monthly" ? plan.monthly : plan.annual}
                <span className="ml-1 text-xs font-normal text-white/60">/{cycle === "monthly" ? "mo" : "yr"}</span>
              </p>
              <p className="mt-2 text-xs text-white/65">{plan.description}</p>
              <ul className="mt-4 space-y-1">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2 text-xs text-white/75">
                    <span className="text-[var(--brand-primary)]">&#10003;</span> {feature}
                  </li>
                ))}
              </ul>
              <Link
                href="/onboarding"
                className="mt-4 block rounded-md bg-[var(--brand-primary)] px-3 py-2 text-center text-sm font-semibold text-white"
              >
                Get started
              </Link>
            </article>
          ))}
        </div>
      )}

      <SectionCard title="Feature comparison" description="Compare what each plan includes.">
        <div className="hidden overflow-x-auto md:block">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-white/60">
                <th className="px-3 py-2">Feature</th>
                <th className="px-3 py-2">Free</th>
                <th className="px-3 py-2">Player Pro</th>
                <th className="px-3 py-2">Coach</th>
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row) => (
                <tr key={row.feature} className="border-b border-white/5 text-white/80">
                  <td className="px-3 py-2 font-medium">{row.feature}</td>
                  <td className="px-3 py-2">{row.free}</td>
                  <td className="px-3 py-2">{row.pro}</td>
                  <td className="px-3 py-2">{row.coach}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-2 md:hidden">
          {plans.map((plan) => (
            <details key={plan.key} className="rounded-md border border-white/10 bg-black/30 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-white">{plan.name}</summary>
              <ul className="mt-3 space-y-2 text-sm text-white/75">
                {plan.features.map((feature) => (
                  <li key={feature}>&bull; {feature}</li>
                ))}
              </ul>
            </details>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Billing FAQ" description="Answers to common membership questions.">
        <div className="space-y-2">
          {faqItems.map((item) => (
            <details key={item.question} className="rounded-md border border-white/10 bg-black/30 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-white">{item.question}</summary>
              <p className="mt-2 text-sm text-white/75">{item.answer}</p>
            </details>
          ))}
        </div>
      </SectionCard>

      <section className="rounded-xl border border-white/10 bg-[var(--surface)] p-6 text-center">
        <h2 className="text-xl font-semibold text-white">Ready to choose your plan?</h2>
        <p className="mt-2 text-sm text-white/70">Start onboarding to unlock the right membership workflow for your role.</p>
        <Link href="/onboarding" className="mt-4 inline-flex rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white">
          Start onboarding
        </Link>
      </section>

      {cards.length < 1 ? (
        <ErrorState title="Pricing load error" description="Unable to load membership options." />
      ) : null}
    </div>
  );
}
