import PageLayout from "@/components/PageLayout";

const memberViews = ["Players", "Parents", "Coaches", "Organizers", "Staff"];

export default function AdminMembersPage() {
  return (
    <PageLayout
      title="Members"
      subtitle="Manage member access, verification status, and membership tiers."
      eyebrow="Admin"
    >
      <section className="grid gap-4 md:grid-cols-2">
        {memberViews.map((view) => (
          <div key={view} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold text-white">{view}</p>
            <p className="mt-2 text-xs text-white/60">Member list view</p>
          </div>
        ))}
      </section>
    </PageLayout>
  );
}
