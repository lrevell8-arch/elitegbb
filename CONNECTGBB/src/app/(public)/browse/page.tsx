import Link from "next/link";
import { EmptyState, ErrorState, PaginationControls, ProfileAvatar, SectionCard, VerificationBadge } from "@/components/ui";
import { getPublicPlayers } from "@/lib/adapters/players";

interface BrowsePageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

const positions = ["PG", "SG", "SF", "PF", "C"];
const gradYears = ["2026", "2027", "2028", "2029", "2030"];
const states = ["GA", "TX", "FL", "NC", "CA", "NY"];
const heights = [
  { label: "5'6+", value: "6" },
  { label: "5'8+", value: "8" },
  { label: "5'10+", value: "10" },
];

const PAGE_SIZE = 24;

export default async function BrowsePage({ searchParams }: BrowsePageProps) {
  const params = await searchParams;
  const position = typeof params.position === "string" ? params.position : "";
  const gradYear = typeof params.gradYear === "string" ? params.gradYear : "";
  const state = typeof params.state === "string" ? params.state : "";
  const heightRange = typeof params.heightRange === "string" ? params.heightRange : "";
  const page = typeof params.page === "string" ? Number(params.page) || 1 : 1;

  const { players, error } = await getPublicPlayers({ position, gradYear, state, heightRange });

  const totalPages = Math.max(1, Math.ceil(players.length / PAGE_SIZE));
  const clampedPage = Math.min(page, totalPages);
  const start = (clampedPage - 1) * PAGE_SIZE;
  const paginated = players.slice(start, start + PAGE_SIZE);

  const queryBase = new URLSearchParams();
  if (position) queryBase.set("position", position);
  if (gradYear) queryBase.set("gradYear", gradYear);
  if (state) queryBase.set("state", state);
  if (heightRange) queryBase.set("heightRange", heightRange);

  const paginationHref = (nextPage: number) => {
    const query = new URLSearchParams(queryBase);
    query.set("page", String(nextPage));
    return `/browse?${query.toString()}`;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="space-y-4">
        <SectionCard title="Filters" description="Refine public player discovery.">
          <form className="space-y-3" action="/browse" method="get">
            <label className="block text-xs text-white/65">Position
              <select name="position" defaultValue={position} className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white">
                <option value="">All</option>
                {positions.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-white/65">Graduation Year
              <select name="gradYear" defaultValue={gradYear} className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white">
                <option value="">All</option>
                {gradYears.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-white/65">State
              <select name="state" defaultValue={state} className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white">
                <option value="">All</option>
                {states.map((item) => (
                  <option key={item} value={item}>{item}</option>
                ))}
              </select>
            </label>
            <label className="block text-xs text-white/65">Height Range
              <select name="heightRange" defaultValue={heightRange} className="w-full rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white">
                <option value="">All</option>
                {heights.map((item) => (
                  <option key={item.value} value={item.value}>{item.label}</option>
                ))}
              </select>
            </label>
            <button type="submit" className="w-full rounded-md bg-[var(--brand-primary)] px-3 py-2 text-sm font-semibold text-white">
              Apply Filters
            </button>
          </form>
        </SectionCard>
      </aside>

      <section className="space-y-4">
        {error ? (
          <ErrorState title="Player data warning" description="Showing fallback public player previews while live data is unavailable." />
        ) : null}

        {paginated.length === 0 ? (
          <EmptyState title="No players match those filters" description="Adjust your filters and try again." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {paginated.map((player) => (
              <article key={player.id} className="relative rounded-md border border-white/10 bg-[var(--surface)] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <ProfileAvatar initials={player.name.split(" ").map((part) => part[0]).join("").slice(0, 2)} size="md" />
                    <div>
                      <p className="text-sm font-semibold text-white">{player.name}</p>
                      <p className="text-xs text-white/65">{player.position} · {player.gradYear}</p>
                      <p className="text-xs text-white/55">{player.state} · {player.height}</p>
                    </div>
                  </div>
                  <VerificationBadge state={player.verified ? "verified" : "unverified"} />
                </div>
                <div className="mt-4 rounded-md border border-dashed border-white/20 bg-black/40 px-3 py-2 text-center text-xs text-white/75">
                  Join to view full profile
                </div>
              </article>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-3">
          <Link href={paginationHref(Math.max(1, clampedPage - 1))} className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-white/80">
            Previous
          </Link>
          <PaginationControls page={clampedPage} totalPages={totalPages} onChange={() => {}} className="pointer-events-none opacity-90" />
          <Link href={paginationHref(Math.min(totalPages, clampedPage + 1))} className="rounded-md border border-white/15 px-3 py-1.5 text-sm text-white/80">
            Next
          </Link>
        </div>
      </section>
    </div>
  );
}
