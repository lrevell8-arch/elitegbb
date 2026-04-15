import PageLayout from "@/components/PageLayout";

const adminLinks = [
  { label: "Members", href: "/admin/members" },
  { label: "Content Moderation", href: "/admin/moderation" },
  { label: "Reports", href: "/admin/reports" },
  { label: "Site Settings", href: "/admin/settings" },
];

export default function AdminDashboardPage() {
  return (
    <PageLayout
      title="Admin Dashboard"
      subtitle="Oversee members, manage safety, and monitor platform activity."
      eyebrow="Admin"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {adminLinks.map((link) => (
          <div key={link.href} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{link.label}</p>
            <p className="mt-2 text-xs text-white/60">{link.href}</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
