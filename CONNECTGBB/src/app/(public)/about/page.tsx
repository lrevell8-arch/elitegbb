import PageLayout from "@/components/PageLayout";

const pillars = [
  {
    title: "Training Excellence",
    description: "Structured programs that move athletes from fundamentals to elite performance.",
  },
  {
    title: "Recruiting Visibility",
    description: "Verified profiles, stats, and highlights packaged for college discovery.",
  },
  {
    title: "Trusted Connections",
    description: "Safe communication channels that respect player and parent boundaries.",
  },
];

export default function AboutPage() {
  return (
    <PageLayout
      title="About ConnectGBB"
      subtitle="ConnectGBB is the membership platform for girls basketball development, recruiting readiness, and trusted community connections."
      eyebrow="Company"
    >
      <section className="grid gap-6 md:grid-cols-3">
        {pillars.map((pillar) => (
          <div key={pillar.title} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
            <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
            <p className="mt-3 text-sm text-white/70">{pillar.description}</p>
          </div>
        ))}
      </section>
      <section className="rounded-2xl border border-white/10 bg-black/60 p-6">
        <h2 className="text-xl font-semibold text-white">Who we serve</h2>
        <p className="mt-3 text-sm text-white/70">
          Players, parents, coaches, and organizers who want a reliable place to train, build visibility,
          and connect with the right programs.
        </p>
        <div className="mt-4 grid gap-3 text-sm text-white/70 md:grid-cols-2">
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">Players (middle school → college)</div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">Parents & guardians</div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">Coaches & recruiters</div>
          <div className="rounded-xl border border-white/10 bg-black/40 p-4">Event organizers</div>
        </div>
      </section>
    </PageLayout>
  );
}
