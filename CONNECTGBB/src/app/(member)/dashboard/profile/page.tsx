import PageLayout from "@/components/PageLayout";

const profileSections = [
  "Player bio + photo",
  "Athletic measurements",
  "Academic profile",
  "Highlights + Hudl links",
  "Privacy controls",
];

export default function DashboardProfilePage() {
  return (
    <PageLayout
      title="My Profile"
      subtitle="Manage player details, highlights, and privacy settings before sharing with coaches."
      eyebrow="Profile"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {profileSections.map((section) => (
          <div key={section} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{section}</p>
            <p className="mt-2 text-xs text-white/60">Editable module</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
