import Link from "next/link";
import { EmptyState, SectionCard, StatusBadge } from "@/components/ui";
import { publicEvents } from "@/lib/adapters/events";

const valueProps = [
  {
    title: "Players",
    description:
      "Build verified profiles, showcase progress, and gain recruiting visibility with trusted data.",
  },
  {
    title: "Parents",
    description: "Stay informed with communication safeguards, visibility controls, and transparent workflows.",
  },
  {
    title: "Coaches",
    description: "Discover verified prospects quickly and connect through safe, structured communication channels.",
  },
];

const pillars = [
  {
    title: "Training Hub",
    description: "Structured lessons, drills, clinics, and recruiting education built for long-term development.",
    icon: "\u{1F3C0}",
  },
  {
    title: "Recruiting Visibility",
    description: "Verified athlete profiles designed to increase discoverability and college-readiness.",
    icon: "\u{1F3AF}",
  },
  {
    title: "Trusted Community",
    description: "Parent-aware communication, moderation controls, and role-based accountability.",
    icon: "\u{1F6E1}\uFE0F",
  },
  {
    title: "Memberships",
    description: "Simple tiered access with clear benefits for players, families, and coaches.",
    icon: "\u{1F4B3}",
  },
];

const howItWorks = ["Create your profile", "Get discovered", "Connect with coaches"];

const faqPreview = [
  {
    question: "How does ConnectGBB protect players?",
    answer: "Parent approval workflows and moderation policies are built into communication experiences.",
  },
  {
    question: "Can coaches directly message players?",
    answer: "Messaging is role-aware and follows trust and safety controls for minors and families.",
  },
  {
    question: "What does verification mean?",
    answer: "Verified profiles and programs provide stronger recruiting credibility and safer interactions.",
  },
  {
    question: "How do memberships work?",
    answer: "Choose the plan that fits your goals and manage billing from your account dashboard.",
  },
];

const upcomingEvents = publicEvents.filter((e) => e.period === "upcoming").slice(0, 3);

export default function HomePage() {
  return (
    <div className="space-y-10">
      <section className="rounded-xl bg-gradient-to-br from-[var(--brand-primary)] to-[var(--brand-secondary)] p-8 text-center">
        <h1 className="text-3xl font-bold text-white md:text-4xl">Elite Girls Basketball. Trusted Platform.</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm text-white/85">
          ConnectGBB helps athletes build development discipline, gain recruiting visibility, and connect safely with the right programs.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link href="/onboarding" className="rounded-md bg-white px-5 py-2.5 text-sm font-semibold text-[var(--brand-primary)]">
            Join ConnectGBB
          </Link>
          <Link href="/browse" className="rounded-md border border-white/30 px-5 py-2.5 text-sm font-semibold text-white">
            Browse Athletes
          </Link>
        </div>
      </section>

      <SectionCard title="Who ConnectGBB is for" description="Built for every stakeholder in elite girls basketball.">
        <div className="grid gap-4 md:grid-cols-3">
          {valueProps.map((vp) => (
            <div key={vp.title} className="rounded-md border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-semibold text-white">{vp.title}</p>
              <p className="mt-1 text-xs text-white/70">{vp.description}</p>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Platform pillars" description="Four connected systems designed for development and trust.">
        <div className="grid gap-3 sm:grid-cols-2">
          {pillars.map((p) => (
            <div key={p.title} className="flex gap-3 rounded-md border border-white/10 bg-black/20 p-4">
              <span className="text-2xl">{p.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white">{p.title}</p>
                <p className="mt-1 text-xs text-white/65">{p.description}</p>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="How it works" description="Three steps to get started.">
        <ol className="space-y-3">
          {howItWorks.map((step, i) => (
            <li key={step} className="flex items-center gap-3 text-sm text-white/80">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-primary)] text-xs font-bold text-white">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        title="Upcoming events"
        description="Clinics, showcases, and education sessions."
        footer={<Link href="/events" className="text-sm font-semibold text-[var(--brand-secondary)]">See All Events</Link>}
      >
        {upcomingEvents.length === 0 ? (
          <EmptyState title="No upcoming events" description="Check back soon." />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {upcomingEvents.map((eventItem) => (
              <article key={eventItem.id} className="rounded-md border border-white/10 bg-black/30 p-4">
                <p className="text-sm font-semibold text-white">{eventItem.name}</p>
                <p className="mt-1 text-xs text-white/65">{eventItem.date} &middot; {eventItem.location}</p>
                <div className="mt-3">
                  <StatusBadge variant={eventItem.status === "Open" ? "active" : eventItem.status === "Waitlist" ? "pending" : "suspended"} />
                </div>
              </article>
            ))}
          </div>
        )}
      </SectionCard>

      <section className="grid gap-4 md:grid-cols-2">
        <SectionCard
          title="Player & Parent"
          description="Profile tools, training access, and recruiting visibility for family-supported development."
          footer={<Link href="/pricing" className="text-sm font-semibold text-[var(--brand-secondary)]">See Full Pricing</Link>}
        >
          <ul className="space-y-2 text-sm text-white/75">
            <li>Verified profile setup</li>
            <li>Training pathways and progress</li>
            <li>Safe communication controls</li>
          </ul>
        </SectionCard>
        <SectionCard
          title="Coach"
          description="Scouting workflows with shortlist and trusted messaging tools for program staff."
          footer={<Link href="/pricing" className="text-sm font-semibold text-[var(--brand-secondary)]">See Full Pricing</Link>}
        >
          <ul className="space-y-2 text-sm text-white/75">
            <li>Search and filter prospects</li>
            <li>Shortlist management</li>
            <li>Moderated connection flow</li>
          </ul>
        </SectionCard>
      </section>

      <SectionCard
        title="FAQ preview"
        description="Common questions from players, parents, and coaches."
        footer={<Link href="/faq" className="text-sm font-semibold text-[var(--brand-secondary)]">See All FAQs</Link>}
      >
        <div className="space-y-2">
          {faqPreview.map((item) => (
            <details key={item.question} className="rounded-md border border-white/10 bg-black/30 px-4 py-3">
              <summary className="cursor-pointer text-sm font-semibold text-white">{item.question}</summary>
              <p className="mt-2 text-sm text-white/70">{item.answer}</p>
            </details>
          ))}
        </div>
      </SectionCard>

      <section className="rounded-xl border border-white/10 bg-[var(--surface)] p-7 text-center">
        <h2 className="text-2xl font-semibold text-white">Ready to get started?</h2>
        <p className="mx-auto mt-3 max-w-2xl text-sm text-white/70">
          Join ConnectGBB and build momentum through verified visibility, trusted communication, and structured development.
        </p>
        <Link href="/onboarding" className="mt-5 inline-flex rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white">
          Join ConnectGBB
        </Link>
      </section>
    </div>
  );
}
