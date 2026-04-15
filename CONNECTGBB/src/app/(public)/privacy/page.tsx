import PageLayout from "@/components/PageLayout";

export default function PrivacyPage() {
  return (
    <PageLayout
      title="Privacy Policy"
      subtitle="We protect athlete information and ensure clear controls for what is public vs members-only."
      eyebrow="Legal"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Key privacy commitments</h2>
        <ul className="mt-4 space-y-2 text-sm text-white/70">
          <li className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">Parent approval for coach-player messaging</li>
          <li className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">Profile privacy controls for public vs members-only data</li>
          <li className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">Transparent data retention and deletion requests</li>
        </ul>
      </section>
    </PageLayout>
  );
}
