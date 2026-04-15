import PageLayout from "@/components/PageLayout";

const settingsAreas = ["Membership tiers", "Training content", "Safety policies", "Stripe integration"];

export default function AdminSettingsPage() {
  return (
    <PageLayout
      title="Site Settings"
      subtitle="Configure membership tiers, training content visibility, and platform safety rules."
      eyebrow="Admin"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {settingsAreas.map((area) => (
          <div key={area} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{area}</p>
            <p className="mt-2 text-xs text-white/60">Configuration module</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
