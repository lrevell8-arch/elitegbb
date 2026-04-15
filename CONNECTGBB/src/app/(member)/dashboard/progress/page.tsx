import PageLayout from "@/components/PageLayout";

const metrics = ["Training completion", "Weekly streak", "Skills assessment", "Recruiting readiness"];

export default function DashboardProgressPage() {
  return (
    <PageLayout
      title="My Progress"
      subtitle="Track completions, assessments, and recruiting readiness in one place."
      eyebrow="Progress"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {metrics.map((metric) => (
          <div key={metric} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{metric}</p>
            <p className="mt-2 text-xs text-white/60">Analytics module</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
