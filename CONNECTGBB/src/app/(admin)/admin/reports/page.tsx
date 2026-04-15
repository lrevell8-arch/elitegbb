import PageLayout from "@/components/PageLayout";

const reportTypes = ["Safety reports", "Message violations", "Profile disputes", "Billing issues"];

export default function AdminReportsPage() {
  return (
    <PageLayout
      title="Reports"
      subtitle="Investigate safety and billing reports with full audit trails."
      eyebrow="Admin"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {reportTypes.map((report) => (
          <div key={report} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{report}</p>
            <p className="mt-2 text-xs text-white/60">Report queue</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
