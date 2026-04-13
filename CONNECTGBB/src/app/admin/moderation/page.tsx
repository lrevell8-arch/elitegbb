import PageLayout from "@/components/PageLayout";

const moderationQueues = ["Community posts", "Comments", "Reported messages", "Profile claims"];

export default function AdminModerationPage() {
  return (
    <PageLayout
      title="Content Moderation"
      subtitle="Review flagged content, approve profile claims, and enforce safety standards."
      eyebrow="Admin"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {moderationQueues.map((queue) => (
          <div key={queue} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{queue}</p>
            <p className="mt-2 text-xs text-white/60">Moderation queue</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
