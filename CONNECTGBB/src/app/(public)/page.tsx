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
    icon: "🏀",
  },
  {
    title: "Recruiting Visibility",
    description: "Verified athlete profiles designed to increase discoverability and college-readiness.",
    icon: "🎯",
  },
  {
    title: "Trusted Community",
    description: "Parent-aware communication, moderation controls, and role-based accountability.",
    icon: "🛡️",
  },
  {
    title: "Memberships",
    description: "Simple tiered access with clear benefits for players, families, and coaches.",
    icon: "💳",
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

export default function HomePage() {
  const upcoming = publicEvents.filter((eventItem) => eventItem.period === "upcoming").slice(0, 3);

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-white/10 bg-[var(--surface)] p-8">
        <p className="text-xs uppercase tracking-[0.24em] text-white/60">ConnectGBB</p>
        <h1 className="mt-4 text-3xl font-semibold text-[var(--foreground)] md:text-5xl">
          The Platform Built for Elite Girls Basketball
        </h1>
        <p className="mt-4 max-w-3xl text-sm text-white/75 md:text-base">
          ConnectGBB brings development, recruiting visibility, and trusted connections into one platform for players, families, and coaches.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/onboarding" className="rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white">
            Join as a Player
          </Link>
          <Link href="/onboarding?role=coach" className="rounded-md border border-white/20 px-4 py-2 text-sm font-semibold text-white/85">
            I&apos;m a Coach
          </Link>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        {valueProps.map((item) => (
          <SectionCard key={item.title} title={item.title} description={item.description} />
        ))}
      </section>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {pillars.map((pillar) => (
          <SectionCard
            key={pillar.title}
            title={pillar.title}
            description={pillar.description}
            footer={<span className="text-lg">{pillar.icon}</span>}
          />
        ))}
      </section>

      <SectionCard title="How it works" description="Three focused steps to accelerate your recruiting journey.">
        <ol className="grid gap-3 md:grid-cols-3">
          {howItWorks.map((step, index) => (
            <li key={step} className="rounded-md border border-white/10 bg-black/30 px-4 py-3 text-sm text-white/80">
              <span className="mr-2 text-xs text-white/50">{index + 1}.</span>
              {step}
            </li>
          ))}
        </ol>
      </SectionCard>

      <SectionCard
        title="Upcoming events"
        description="Clinics, showcases, and recruiting education sessions."
        footer={<Link href="/events" className="text-sm font-semibold text-[var(--brand-secondary)]">View All Events</Link>}
      >
        {upcoming.length === 0 ? (
          <EmptyState title="No upcoming events" description="Check back soon for new events." />
        ) : (
          <div className="grid gap-3 md:grid-cols-3">
            {upcoming.map((eventItem) => (
              <article key={eventItem.id} className="rounded-md border border-white/10 bg-black/30 p-4">
                <p className="text-sm font-semibold text-white">{eventItem.name}</p>
                <p className="mt-1 text-xs text-white/65">{eventItem.date} · {eventItem.location}</p>
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
