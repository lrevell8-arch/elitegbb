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
                Each path below is scaffolded as a placeholder page so we can build UI modules and API
                integration progressively.
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
      </main>
      <Footer />
    </div>
  );
}
