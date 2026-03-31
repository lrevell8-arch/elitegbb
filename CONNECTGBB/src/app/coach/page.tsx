import PageLayout from "@/components/PageLayout";

const coachLinks = [
  { label: "Search Players", href: "/coach/search" },
  { label: "Shortlist", href: "/coach/shortlist" },
  { label: "Messages", href: "/coach/messages" },
  { label: "My Profile", href: "/coach/profile" },
];

export default function CoachDashboardPage() {
  return (
    <PageLayout
      title="Coach Dashboard"
      subtitle="Search verified players, manage shortlists, and request contact through safe workflows."
      eyebrow="Coach"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {coachLinks.map((link) => (
          <div key={link.href} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{link.label}</p>
            <p className="mt-2 text-xs text-white/60">{link.href}</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
