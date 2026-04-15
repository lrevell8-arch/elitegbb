import PageLayout from "@/components/PageLayout";

const filters = ["Class Year", "Position", "Location", "Team", "GPA", "Verified Badge"];

export default function BrowsePage() {
  return (
    <PageLayout
      title="Browse Players"
      subtitle="Search verified player profiles with filters for class year, position, academics, and location."
      eyebrow="Directory"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Directory filters</h2>
        <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-3">
          {filters.map((filter) => (
            <div key={filter} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
              {filter}
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-black/60 p-6">
        <h2 className="text-lg font-semibold text-white">Coach access</h2>
        <p className="mt-2 text-sm text-white/70">
          Coaches can shortlist prospects and request contact through parent-approved workflows.
        </p>
      </section>
    </PageLayout>
  );
}
