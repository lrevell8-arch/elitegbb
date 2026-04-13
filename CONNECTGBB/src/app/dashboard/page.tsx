"use client";

import PageLayout from "@/components/PageLayout";
import { useAuth } from "@/components/AuthProvider";
import { ROLE_LABELS } from "@/lib/roles";

const quickLinks = [
  { label: "My Profile", href: "/dashboard/profile" },
  { label: "Training", href: "/dashboard/training" },
  { label: "My Progress", href: "/dashboard/progress" },
  { label: "Connections", href: "/dashboard/connections" },
  { label: "Saved Content", href: "/dashboard/saved" },
];

export default function DashboardPage() {
  const { profile } = useAuth();

  return (
    <PageLayout
      title="Member Dashboard"
      subtitle="Track training progress, update your profile, and manage recruiting connections."
      eyebrow="Player / Parent"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Member snapshot</h2>
        {profile ? (
          <p className="mt-2 text-sm text-white/70">
            Signed in as {profile.display_name} · {ROLE_LABELS[profile.role]}
          </p>
        ) : (
          <p className="mt-2 text-sm text-white/70">Complete onboarding to personalize your dashboard.</p>
        )}
      </section>
      <section className="grid gap-4 md:grid-cols-2">
        {quickLinks.map((link) => (
          <div key={link.href} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{link.label}</p>
            <p className="mt-2 text-xs text-white/60">{link.href}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-white/10 bg-black/60 p-6">
        <h2 className="text-lg font-semibold text-white">Next steps</h2>
        <p className="mt-2 text-sm text-white/70">
          Complete onboarding, claim your profile, and start a training track to unlock recruiting
          visibility.
        </p>
      </section>
    </PageLayout>
  );
}
