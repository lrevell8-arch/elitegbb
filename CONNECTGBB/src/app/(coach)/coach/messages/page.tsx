import PageLayout from "@/components/PageLayout";

const safeguards = [
  "Parent/guardian approval for minors",
  "Moderation logging",
  "Verified coach access only",
];

export default function CoachMessagesPage() {
  return (
    <PageLayout
      title="Messages"
      subtitle="Communicate with players and parents through safe, monitored messaging channels."
      eyebrow="Coach"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Safety safeguards</h2>
        <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
          {safeguards.map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
              {item}
            </div>
          ))}
        </div>
      </section>
    </PageLayout>
  );
}
