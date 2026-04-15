import PageLayout from "@/components/PageLayout";

const contactOptions = [
  { title: "Support", detail: "info@elitegbb.com" },
  { title: "Partnerships", detail: "partners@elitegbb.com" },
  { title: "Events", detail: "events@elitegbb.com" },
];

export default function ContactPage() {
  return (
    <PageLayout
      title="Contact"
      subtitle="Reach out for membership support, partnership inquiries, or event collaborations."
      eyebrow="Contact"
    >
      <section className="grid gap-4 md:grid-cols-3">
        {contactOptions.map((option) => (
          <div key={option.title} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[#0134bd]">
              {option.title}
            </p>
            <p className="mt-3 text-sm text-white/70">{option.detail}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-white/10 bg-black/60 p-6">
        <h2 className="text-lg font-semibold text-white">General inquiries</h2>
        <p className="mt-2 text-sm text-white/70">
          We respond within 1 business day. Coaches and organizers can request verification support here as
          well.
        </p>
      </section>
    </PageLayout>
  );
}
