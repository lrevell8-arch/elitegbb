import PageLayout from "@/components/PageLayout";

const connectionSteps = [
  "Search coaches or programs",
  "Send connection request",
  "Parent approval (if required)",
  "Start verified conversation",
];

export default function DashboardConnectionsPage() {
  return (
    <PageLayout
      title="Connections"
      subtitle="Manage recruiting connections and track coach outreach activity."
      eyebrow="Connections"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Connection workflow</h2>
        <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
          {connectionSteps.map((step) => (
            <div key={step} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
              {step}
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
