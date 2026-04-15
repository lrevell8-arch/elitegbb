import Footer from "@/components/Footer";
import Navigation from "@/components/Navigation";

const highlights = [
  {
    title: "Training Hub",
    description: "Video lessons, drill libraries, clinics, and recruiting education organized by level and position.",
  },
  {
    title: "Recruiting Visibility",
    description: "Verified profiles with stats, highlights, and coach endorsements to elevate discovery.",
  },
  {
    title: "Trusted Community",
    description: "Safe messaging, parent approval workflows, and moderated discussion spaces.",
  },
];

const routeGroups = [
  {
    title: "Public",
    routes: ["/", "/about", "/pricing", "/browse", "/events", "/faq", "/contact"],
  },
  {
    title: "Player / Parent",
    routes: [
      "/dashboard",
      "/dashboard/profile",
      "/dashboard/training",
      "/dashboard/progress",
      "/dashboard/connections",
      "/dashboard/saved",
    ],
  },
  {
    title: "Coach",
    routes: ["/coach", "/coach/search", "/coach/shortlist", "/coach/messages", "/coach/profile"],
  },
  {
    title: "Admin",
    routes: ["/admin", "/admin/members", "/admin/moderation", "/admin/reports", "/admin/settings"],
  },
  {
    title: "Auth",
    routes: ["/login", "/onboarding", "/billing"],
  },
];

const uiModules = [
  {
    title: "Navigation + Layout System",
    description:
      "Global nav, role-aware menus, and responsive content shells shared by public, member, coach, and admin areas.",
    routes: ["/", "/dashboard", "/coach", "/admin"],
    deliverables: ["Primary nav", "Role guard states", "Shared page shells"],
    status: "Implemented",
  },
  {
    title: "Account + Onboarding Flows",
    description:
      "Authentication touchpoints, role selection, and profile bootstrap forms for player, parent, and coach personas.",
    routes: ["/login", "/onboarding", "/dashboard/profile", "/coach/profile"],
    deliverables: ["Login/signup", "Role picker", "Profile bootstrap"],
    status: "In Progress",
  },
  {
    title: "Discovery + Messaging",
    description:
      "Coach search patterns, saved shortlists, secure inbox scaffolds, and connections workflows between members.",
    routes: ["/coach/search", "/coach/shortlist", "/coach/messages", "/dashboard/connections"],
    deliverables: ["Player search filters", "Shortlist actions", "Coach-member inbox"],
    status: "In Progress",
  },
  {
    title: "Operations + Billing",
    description:
      "Admin oversight pages and Stripe-connected billing controls with shared UI primitives for secure account management.",
    routes: ["/admin/members", "/admin/moderation", "/admin/reports", "/billing"],
    deliverables: ["Admin moderation tools", "Reporting dashboards", "Billing management"],
    status: "Scaffolded",
  },
];

const apiIntegrations = [
  {
    domain: "Authentication",
    summary: "Session bootstrapping and role-based guards powered by Supabase auth state.",
    source: "Supabase Auth",
    path: "/api/auth/*",
    methods: "GET, POST",
    readiness: "Connected",
  },
  {
    domain: "Profiles + Membership",
    summary: "User profile hydration, onboarding persistence, and member-role metadata reads/writes.",
    source: "Supabase Postgres",
    path: "/api/profile, /api/onboarding",
    methods: "GET, POST, PATCH",
    readiness: "Connected",
  },
  {
    domain: "Training + Progress",
    summary: "Workout plans, milestones, and saved-resource mapping for player development tracking.",
    source: "Planned API routes",
    path: "/api/training, /api/progress",
    methods: "GET, POST",
    readiness: "Scaffolded",
  },
  {
    domain: "Messaging + Moderation",
    summary: "Coach/member conversations with moderation workflows and report escalation support.",
    source: "Planned API routes",
    path: "/api/messages, /api/moderation",
    methods: "GET, POST, PATCH",
    readiness: "Scaffolded",
  },
  {
    domain: "Billing + Access Control",
    summary: "Subscription state sync and gated feature flags for premium memberships.",
    source: "Stripe + server actions",
    path: "/api/billing, /api/stripe/webhook",
    methods: "POST",
    readiness: "In Progress",
  },
];

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-black">
      <Navigation />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16">
        <section className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0b0b0b] via-[#0b0b0b] to-[#0f172a] p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.35em] text-[#fb6c1d]">ConnectGBB</p>
          <h1 className="mt-6 text-4xl font-semibold text-white md:text-5xl">
            The membership platform for elite girls basketball development.
          </h1>
          <p className="mt-4 max-w-2xl text-base text-white/70 md:text-lg">
            ConnectGBB pairs training, recruiting visibility, and trusted community messaging for players,
            parents, and coaches. This Next.js build will replace the existing marketing front end while
            extending the current Supabase schema.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <span className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70">
              Training Hub
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70">
              Profile Builder
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70">
              Community + Messaging
            </span>
            <span className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/70">
              Stripe Memberships
            </span>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          {highlights.map((item) => (
            <div key={item.title} className="rounded-2xl border border-white/10 bg-[#0b0b0b] p-6">
              <h3 className="text-lg font-semibold text-white">{item.title}</h3>
              <p className="mt-3 text-sm text-white/70">{item.description}</p>
            </div>
          ))}
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-8">
          <div className="flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-white">Routing map for the new experience</h2>
              <p className="mt-2 text-sm text-white/70">
                Each path below maps to a routed page in the Next.js App Router and now feeds the module and
                integration roadmap sections underneath.
              </p>
            </div>
            <div className="rounded-full border border-white/10 px-4 py-2 text-xs text-white/60">
              Next.js App Router
            </div>
          </div>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            {routeGroups.map((group) => (
              <div key={group.title} className="rounded-2xl border border-white/10 bg-black/40 p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0134bd]">
                  {group.title}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-white/70">
                  {group.routes.map((route) => (
                    <li key={route} className="rounded-lg border border-white/5 bg-black/40 px-3 py-2">
                      {route}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-8">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0134bd]">Build roadmap</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">UI Modules</h2>
              <p className="mt-2 max-w-2xl text-sm text-white/70">
                Core interface areas are now grouped into reusable modules so route work can ship in vertical
                slices.
              </p>
            </div>
          </div>
          <div className="mt-8 grid gap-5 md:grid-cols-2">
            {uiModules.map((module) => (
              <article key={module.title} className="rounded-2xl border border-white/10 bg-black/40 p-6">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-semibold text-white">{module.title}</h3>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.2em] text-white/60">
                    {module.status}
                  </span>
                </div>
                <p className="mt-3 text-sm text-white/70">{module.description}</p>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {module.deliverables.map((deliverable) => (
                    <li
                      key={deliverable}
                      className="rounded-md border border-[#0134bd]/50 bg-[#0134bd]/10 px-2.5 py-1 text-xs text-[#8ba8ff]"
                    >
                      {deliverable}
                    </li>
                  ))}
                </ul>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {module.routes.map((route) => (
                    <li
                      key={route}
                      className="rounded-md border border-white/10 bg-black px-2.5 py-1 text-xs text-white/65"
                    >
                      {route}
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-3xl border border-white/10 bg-[#0b0b0b] p-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[#0134bd]">Backend wiring</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">API Integration</h2>
            <p className="mt-2 max-w-2xl text-sm text-white/70">
              Integration domains are mapped by data source so product and engineering can align rollout
              sequencing.
            </p>
          </div>
          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full border-collapse text-left">
              <thead className="bg-black/70">
                <tr className="text-xs uppercase tracking-[0.22em] text-white/55">
                  <th className="px-4 py-3 font-medium">Domain</th>
                  <th className="px-4 py-3 font-medium">Integration</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 font-medium">Path</th>
                  <th className="px-4 py-3 font-medium">Methods</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {apiIntegrations.map((integration) => (
                  <tr key={integration.domain} className="border-t border-white/10 bg-black/35 text-sm">
                    <td className="px-4 py-3 font-medium text-white">{integration.domain}</td>
                    <td className="px-4 py-3 text-white/70">{integration.summary}</td>
                    <td className="px-4 py-3 text-white/70">{integration.source}</td>
                    <td className="px-4 py-3 text-white/70">{integration.path}</td>
                    <td className="px-4 py-3 text-white/70">{integration.methods}</td>
                    <td className="px-4 py-3 text-white/70">{integration.readiness}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
