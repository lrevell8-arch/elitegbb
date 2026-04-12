import PageLayout from "@/components/PageLayout";

const eventTypes = [
  "Clinics & Camps",
  "Showcases",
  "Recruiting Webinars",
  "Team Combines",
  "Parent Education",
];

export default function EventsPage() {
  return (
    <PageLayout
      title="Events"
      subtitle="Find upcoming showcases, clinics, and recruiting education sessions hosted by verified organizers."
      eyebrow="Events"
    >
      <section className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
        <h2 className="text-lg font-semibold text-white">Event categories</h2>
        <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
          {eventTypes.map((item) => (
            <div key={item} className="rounded-xl border border-white/10 bg-black/40 px-4 py-3">
              {item}
            </div>
          ))}
        </div>
      </section>
      <section className="rounded-2xl border border-white/10 bg-black/60 p-6">
        <h2 className="text-lg font-semibold text-white">Organizer tools</h2>
        <p className="mt-2 text-sm text-white/70">
          Verified organizers can publish events, manage RSVPs, and invite targeted cohorts of athletes.
        </p>
      </section>
    </PageLayout>
  );
}
