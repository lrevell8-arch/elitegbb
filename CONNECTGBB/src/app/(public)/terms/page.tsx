import PageLayout from "@/components/PageLayout";

export default function TermsPage() {
  return (
    <PageLayout
      title="Terms of Service"
      subtitle="Community guidelines and membership terms for players, parents, coaches, and organizers."
      eyebrow="Legal"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Community standards</h2>
        <ul className="mt-4 space-y-2 text-sm text-white/70">
          <li className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">Respectful communication at all times</li>
          <li className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">No recruiting promises or improper contact</li>
          <li className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">Report concerns immediately to moderators</li>
        </ul>
      </section>
    </PageLayout>
  );
}
