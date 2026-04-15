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
    answer: "Yes, coaches can subscribe to scouting and communication-focused tools.",
  },
  {
    question: "Do families need separate accounts?",
    answer: "Family workflows are supported through role-aware account setup.",
  },
  {
    question: "Where do I manage billing?",
    answer: "Billing is managed from your account after onboarding.",
  },
];

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");
  const [ready] = useState(true);

  const cards = useMemo(() => plans, []);

  if (!ready) {
    return <SkeletonCard rows={4} columns={1} />;
  }

  if (cards.length === 0) {
    return (
      <EmptyState
        title="Pricing unavailable"
        description="Please check back shortly for current membership options."
      />
    );
  }

  return (
    <div className="space-y-8">
      <SectionCard title="Simple, transparent pricing" description="Choose a plan that matches your goals and role.">
        <div className="inline-flex rounded-md border border-white/15 bg-black/30 p-1">
          <button
            type="button"
            onClick={() => setCycle("monthly")}
            className={`rounded px-3 py-1.5 text-sm ${cycle === "monthly" ? "bg-[var(--brand-primary)] text-white" : "text-white/70"}`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setCycle("annual")}
            className={`rounded px-3 py-1.5 text-sm ${cycle === "annual" ? "bg-[var(--brand-primary)] text-white" : "text-white/70"}`}
          >
            Annual
          </button>
        </div>
      </SectionCard>

      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((plan) => (
          <SectionCard
            key={plan.key}
            title={plan.name}
            description={plan.description}
            footer={
              <Link
                href={`/onboarding?plan=${plan.key}&cycle=${cycle}`}
                className="inline-flex rounded-md bg-[var(--brand-primary)] px-3 py-2 text-sm font-semibold text-white"
              >
                Choose {plan.name}
              </Link>
            }
          >
            <div className="space-y-3">
              <MembershipBadge tier={plan.key === "player-pro" ? "development" : plan.key === "coach" ? "elite" : "free"} />
              <p className="text-3xl font-semibold text-white">{cycle === "monthly" ? plan.monthly : plan.annual}</p>
              <p className="text-xs uppercase tracking-[0.2em] text-white/55">{cycle}</p>
              <ul className="space-y-2 text-sm text-white/75">
                {plan.features.map((feature) => (
                  <li key={feature}>• {feature}</li>
                ))}
              </ul>
            </div>
          </SectionCard>
        ))}
      </section>

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
                  <li key={feature}>• {feature}</li>
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
