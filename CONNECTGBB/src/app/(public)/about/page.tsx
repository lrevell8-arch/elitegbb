import Link from "next/link";
import { SectionCard, StatCard } from "@/components/ui";

const teamRoles = ["Player Development Advisors", "College Recruiting Advisors", "Safety & Moderation Team", "Community Partnerships"];

export default function AboutPage() {
  return (
    <div className="space-y-8">
      <SectionCard
        title="About ConnectGBB"
        description="Our mission is to help elite girls basketball athletes build skills, gain visibility, and connect safely with the right programs."
      />

      <section className="grid gap-4 md:grid-cols-3">
        <StatCard label="Focus" value="Girls Basketball" delta="Development + recruiting alignment" />
        <StatCard label="Approach" value="Trusted Network" delta="Players, families, and coaches" />
        <StatCard label="Outcome" value="College Ready" delta="Visibility and relationship quality" />
      </section>

      <SectionCard title="Brand story" description="ConnectGBB was built to close the gap between talent and opportunity.">
        <div className="space-y-3 text-sm text-white/75">
          <p>
            The platform started from a simple reality: many high-potential girls basketball athletes train hard but lack consistent, credible exposure pathways.
          </p>
          <p>
            Families needed a clearer system for progress tracking, communication safety, and recruiting readiness. Coaches needed reliable profile quality and trustworthy context.
          </p>
          <p>
            ConnectGBB connects these priorities in one membership experience built around development discipline, verified visibility, and responsible connections.
          </p>
        </div>
      </SectionCard>

      <SectionCard title="Why girls basketball" description="The opportunity is growing faster than the infrastructure around it.">
        <p className="text-sm text-white/75">
          Girls basketball continues to grow in talent depth, competition quality, and college opportunities. The recruiting process still remains fragmented for many families. ConnectGBB is designed to provide the structure, trust, and clarity needed to support athletes through every stage.
        </p>
      </SectionCard>

      <SectionCard title="Trust and safety" description="Player protection and family confidence are non-negotiable.">
        <ul className="space-y-2 text-sm text-white/75">
          <li>Role-based access controls for member experiences.</li>
          <li>Parent-aware communication pathways for minors.</li>
          <li>Moderation and reporting workflows to enforce community standards.</li>
          <li>Verified profile and program context for credible interactions.</li>
        </ul>
      </SectionCard>

      <SectionCard title="Team and advisory" description="ConnectGBB combines expertise across player development and platform operations.">
        <div className="grid gap-3 sm:grid-cols-2">
          {teamRoles.map((role) => (
            <article key={role} className="rounded-md border border-white/10 bg-black/30 p-4">
              <p className="text-sm font-semibold text-white">{role}</p>
            </article>
          ))}
        </div>
      </SectionCard>

      <section className="rounded-xl border border-white/10 bg-[var(--surface)] p-6 text-center">
        <h2 className="text-xl font-semibold text-white">Join the platform</h2>
        <p className="mt-2 text-sm text-white/70">Create your profile and start building a trusted recruiting pathway.</p>
        <Link href="/onboarding" className="mt-4 inline-flex rounded-md bg-[var(--brand-primary)] px-4 py-2 text-sm font-semibold text-white">
          Start onboarding
        </Link>
      </section>
    </div>
  );
}
