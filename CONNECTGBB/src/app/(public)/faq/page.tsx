"use client";

import { useState } from "react";
import { EmptyState, ErrorState, SectionCard } from "@/components/ui";

type CategoryKey = "general" | "players" | "coaches" | "billing" | "safety";

const faqByCategory: Record<CategoryKey, Array<{ question: string; answer: string }>> = {
  general: [
    { question: "What is ConnectGBB?", answer: "ConnectGBB is a membership platform focused on development, recruiting visibility, and trusted communication." },
    { question: "Who is ConnectGBB for?", answer: "Players, parents, coaches, and program operators in elite girls basketball." },
    { question: "Do I need to be invited?", answer: "No. You can create an account and complete onboarding directly." },
    { question: "Can I use ConnectGBB year-round?", answer: "Yes, the platform is designed for continuous development and recruiting readiness." },
  ],
  players: [
    { question: "How do I improve profile visibility?", answer: "Complete your profile, keep highlights current, and engage with training and progress modules." },
    { question: "Can parents view account activity?", answer: "Yes, family workflows are designed for shared visibility and support." },
    { question: "What profile data is public?", answer: "Public browse views are limited and sensitive details remain protected." },
    { question: "How do I prepare for college recruiting?", answer: "Use training, progress, and profile tools to build a complete recruiting story." },
  ],
  coaches: [
    { question: "How do I search for prospects?", answer: "Coach search tools support filtering by position, class, and location." },
    { question: "Can I save prospects?", answer: "Yes, shortlist features let you track priority athletes." },
    { question: "How does messaging work?", answer: "Messaging is trusted and role-aware with safety controls in place." },
    { question: "Can I manage program profile details?", answer: "Yes, coach profile pages support program and recruiting context updates." },
  ],
  billing: [
    { question: "What plans are available?", answer: "Free, Player Pro, and Coach plans are available with clear feature differences." },
    { question: "Can I switch plans later?", answer: "Yes, you can change plans as needs evolve." },
    { question: "Do you offer annual billing?", answer: "Yes, annual billing options are available." },
    { question: "How do I access billing controls?", answer: "Billing controls are available in your account billing section." },
  ],
  safety: [
    { question: "How are minors protected?", answer: "Communication workflows include parent-aware protections and moderation support." },
    { question: "Can users report concerns?", answer: "Yes, users can report concerns directly through support pathways." },
    { question: "How are accounts verified?", answer: "Verification processes improve trust for profiles and program identities." },
    { question: "What happens when content is flagged?", answer: "Moderation workflows review flagged content and enforce platform standards." },
  ],
};

const categoryLabels: Record<CategoryKey, string> = {
  general: "General",
  players: "Players & Parents",
  coaches: "Coaches",
  billing: "Billing",
  safety: "Safety & Moderation",
};

export default function FAQPage() {
  const [category, setCategory] = useState<CategoryKey>("general");
  const [loadError] = useState<string | null>(null);

  if (loadError) {
    return <ErrorState title="Unable to load FAQ" description={loadError} />;
  }

  const items = faqByCategory[category];

  return (
    <div className="space-y-6">
      <SectionCard title="Frequently Asked Questions" description="Find quick answers across membership, recruiting, and safety.">
        <div className="flex flex-wrap gap-2">
          {(Object.keys(categoryLabels) as CategoryKey[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setCategory(key)}
              className={`rounded-md px-3 py-2 text-sm ${category === key ? "bg-[var(--brand-primary)] text-white" : "border border-white/15 text-white/75"}`}
            >
              {categoryLabels[key]}
            </button>
          ))}
        </div>
      </SectionCard>

      <section className="space-y-2">
        {items.length === 0 ? (
          <EmptyState title="No questions in this category" description="Please choose another FAQ category." />
        ) : (
          items.map((item) => (
            <details key={item.question} className="rounded-md border border-white/10 bg-[var(--surface)] px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-white">{item.question}</summary>
              <p className="mt-2 text-sm text-white/75">{item.answer}</p>
            </details>
          ))
        )}
      </section>
    </div>
  );
}
