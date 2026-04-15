import Link from "next/link";
import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";

const audiences = [
  {
    title: "Players",
    description:
      "Build a verified profile, follow structured training tracks, and stay ready for recruiting opportunities.",
    cta: { label: "Explore training", href: "/dashboard/training" },
  },
  {
    title: "Parents",
    description:
      "Track progress, monitor communication, and support your athlete inside a trusted, moderated platform.",
    cta: { label: "See safety features", href: "/faq" },
  },
  {
    title: "Coaches",
    description:
      "Search verified prospects, shortlist efficiently, and connect through parent-aware communication workflows.",
    cta: { label: "Browse prospects", href: "/coach/search" },
  },
];

const platformPillars = [
  {
    title: "Training Hub",
    points: ["Video lessons", "Drill libraries", "Clinics", "Recruiting education"],
  },
  {
    title: "Recruiting Visibility",
    points: ["Verified profiles", "Stats + highlights", "Coach endorsements", "Search + shortlist"],
  },
  {
    title: "Trusted Community",
    points: ["Safe messaging", "Parent approval", "Moderation workflows", "Verified accounts"],
  },
  {
    title: "Memberships",
    points: ["Stripe billing", "Role-based access", "Tiered features", "Account controls"],
  },
];

const previewModules = [
  {
    title: "Member Dashboard",
    description: "Profile completion, saved resources, progress snapshots, and upcoming events in one view.",
    href: "/dashboard",
  },
  {
    title: "Coach Workspace",
    description: "Prospect search, shortlist actions, and secure messaging tools designed for recruiting teams.",
    href: "/coach",
  },
  {
    title: "Admin Operations",
    description: "Member oversight, moderation queues, reports, and platform configuration controls.",
    href: "/admin",
  },
];

const upcomingEvents = [
  { name: "Spring Skills Combine", date: "May 4", location: "Atlanta, GA", status: "Open" },
  { name: "Recruiting Readiness Webinar", date: "May 12", location: "Live Virtual", status: "Open" },
  { name: "Elite Guard Clinic", date: "May 18", location: "Dallas, TX", status: "Waitlist" },
];

const pricingHighlights = [
  "Free onboarding + profile claim",
  "Development tier for structured training",
  "Elite tier for full recruiting workflows",
  "Coach and family billing via Stripe",
];

const faqPreview = [
  {
    q: "How does messaging stay safe for minors?",
    a: "Parent/guardian approval and moderation logging are built into communication workflows.",
  },
  {
    q: "Can coaches see every profile?",
    a: "Public discovery is limited. Verified access unlocks deeper recruiting information and actions.",
  },
  {
    q: "How do billing upgrades work?",
    a: "Membership changes route through Stripe so upgrades and renewals stay secure and auditable.",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Navigation />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-14 px-6 py-16">
        <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0b0b0b] via-[#0b0b0b] to-[#0f172a] p-10 md:p-14">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#fb6c1d]">ConnectGBB</p>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white md:text-5xl">
            The membership platform for elite girls basketball development.
          </h1>
          <p className="mt-4 max-w-3xl text-base text-white/70 md:text-lg">
            ConnectGBB combines training, recruiting visibility, and trusted communication so players,
            parents, and coaches can operate in one connected system.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pricing"
              className="rounded-full bg-[#0134bd] px-5 py-2.5 text-sm font-semibold text-white"
            >
              Join Membership
            </Link>
            <Link
              href="/browse"
              className="rounded-full border border-white/15 px-5 py-2.5 text-sm font-semibold text-white/85"
            >
              Browse Players
            </Link>
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {audiences.map((audience) => (
            <article key={audience.title} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
              <h2 className="text-lg font-semibold text-white">{audience.title}</h2>
              <p className="mt-3 text-sm text-white/70">{audience.description}</p>
              <Link href={audience.cta.href} className="mt-5 inline-flex text-sm font-semibold text-[#8ba8ff]">
                {audience.cta.label}
              </Link>
            </article>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-8">
          <h2 className="text-2xl font-semibold text-white">Platform pillars</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {platformPillars.map((pillar) => (
              <article key={pillar.title} className="rounded-2xl border border-white/10 bg-black/40 p-6">
                <h3 className="text-lg font-semibold text-white">{pillar.title}</h3>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  {pillar.points.map((point) => (
                    <li key={point} className="rounded-lg border border-white/5 bg-black/50 px-3 py-2">
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-5 md:grid-cols-3">
          {previewModules.map((module) => (
            <article key={module.title} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
              <h3 className="text-base font-semibold text-white">{module.title}</h3>
              <p className="mt-3 text-sm text-white/70">{module.description}</p>
              <Link href={module.href} className="mt-4 inline-flex text-sm font-semibold text-[#8ba8ff]">
                Open module
              </Link>
            </article>
          ))}
        </section>

        <section className="grid gap-5 md:grid-cols-2">
          <article className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Upcoming events</h2>
              <Link href="/events" className="text-sm font-semibold text-[#8ba8ff]">
                View all
              </Link>
            </div>
            <div className="mt-5 space-y-3">
              {upcomingEvents.map((eventItem) => (
                <div key={eventItem.name} className="rounded-xl border border-white/10 bg-black/45 p-4">
                  <p className="text-sm font-semibold text-white">{eventItem.name}</p>
                  <p className="mt-1 text-xs text-white/65">
                    {eventItem.date} · {eventItem.location}
                  </p>
                  <p className="mt-2 text-xs uppercase tracking-[0.2em] text-[#fb6c1d]">{eventItem.status}</p>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-8">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-white">Membership options</h2>
              <Link href="/pricing" className="text-sm font-semibold text-[#8ba8ff]">
                Compare plans
              </Link>
            </div>
            <ul className="mt-5 space-y-3 text-sm text-white/70">
              {pricingHighlights.map((item) => (
                <li key={item} className="rounded-xl border border-white/10 bg-black/45 px-4 py-3">
                  {item}
                </li>
              ))}
            </ul>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-8">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-2xl font-semibold text-white">Frequently asked questions</h2>
            <Link href="/faq" className="text-sm font-semibold text-[#8ba8ff]">
              Full FAQ
            </Link>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {faqPreview.map((item) => (
              <article key={item.q} className="rounded-2xl border border-white/10 bg-black/45 p-5">
                <h3 className="text-sm font-semibold text-white">{item.q}</h3>
                <p className="mt-3 text-sm text-white/70">{item.a}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-[#0134bd]/60 bg-[#0134bd]/15 p-8 text-center">
          <h2 className="text-2xl font-semibold text-white">Ready to level up your recruiting journey?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-white/75">
            Join ConnectGBB to train consistently, build visibility with trusted data, and create meaningful
            coach connections.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <Link href="/onboarding" className="rounded-full bg-[#0134bd] px-5 py-2.5 text-sm font-semibold text-white">
              Start onboarding
            </Link>
            <Link href="/contact" className="rounded-full border border-white/20 px-5 py-2.5 text-sm font-semibold text-white/85">
              Contact our team
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
