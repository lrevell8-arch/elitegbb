import PageLayout from "@/components/PageLayout";

const savedItems = ["Saved drills", "Saved videos", "Recruiting guides", "Events to attend"];

export default function DashboardSavedPage() {
  return (
    <PageLayout
      title="Saved Content"
      subtitle="Organize your saved drills, videos, and recruiting resources into playlists."
      eyebrow="Saved"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {savedItems.map((item) => (
          <div key={item} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{item}</p>
            <p className="mt-2 text-xs text-white/60">Playlist module</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
