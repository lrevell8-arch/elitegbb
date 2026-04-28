"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EmptyState, FilterBar, PaginationControls, ProfileAvatar, SearchBar, VerificationBadge } from "@/components/ui";
import { useAuth } from "@/components/AuthProvider";
import type { PublicPlayer } from "@/lib/adapters/players";

interface SearchWorkspaceClientProps {
  players: PublicPlayer[];
}

const PAGE_SIZE = 24;

export function SearchWorkspaceClient({ players }: SearchWorkspaceClientProps) {
  const { profile } = useAuth();
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<"relevance" | "grad" | "height" | "recent">("relevance");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [selectedYears, setSelectedYears] = useState<string[]>([]);
  const [selectedPositions, setSelectedPositions] = useState<string[]>([]);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [hasHighlights, setHasHighlights] = useState(false);
  const [heightMinInches, setHeightMinInches] = useState(6);
  const [gpaMinTenths, setGpaMinTenths] = useState(30);
  const [page, setPage] = useState(1);
  const [savedIds, setSavedIds] = useState<string[]>([]);
  const [status, setStatus] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const normalized = players.filter((p) => {
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      if (selectedYears.length > 0 && !selectedYears.includes(p.gradYear)) return false;
      if (selectedPositions.length > 0 && !selectedPositions.includes(p.position)) return false;
      if (selectedStates.length > 0 && !selectedStates.includes(p.state)) return false;
      if (verifiedOnly && !p.verified) return false;
      if (hasHighlights && Number.parseInt(p.id.replace(/[^0-9]/g, ""), 10) % 2 === 1) return false;
      const heightMatch = p.height.match(/(\d+)'(\d+)/);
      const inches = heightMatch ? Number(heightMatch[1]) * 12 + Number(heightMatch[2]) : 0;
      return inches >= heightMinInches;
    });

    if (sortBy === "grad") return [...normalized].sort((a, b) => Number(a.gradYear) - Number(b.gradYear));
    if (sortBy === "height") return [...normalized].sort((a, b) => (a.height > b.height ? -1 : 1));
    if (sortBy === "recent") return [...normalized].reverse();
    return normalized;
  }, [players, query, selectedYears, selectedPositions, selectedStates, verifiedOnly, hasHighlights, heightMinInches, sortBy]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const activeFilters = [
    ...selectedYears.map((year) => ({ id: `year-${year}`, label: `Year: ${year}` })),
    ...selectedPositions.map((position) => ({ id: `position-${position}`, label: `Position: ${position}` })),
    ...selectedStates.map((state) => ({ id: `state-${state}`, label: `State: ${state}` })),
    verifiedOnly ? { id: "verified", label: "Verified only" } : null,
    hasHighlights ? { id: "highlights", label: "Has highlights" } : null,
    { id: "height", label: `Min height: ${Math.floor(heightMinInches / 12)}'${heightMinInches % 12}"` },
    { id: "gpa", label: `GPA ${(gpaMinTenths / 10).toFixed(1)}+` },
  ].filter((item): item is { id: string; label: string } => Boolean(item));

  const toggleFilter = (value: string, selected: string[], setter: (next: string[]) => void) => {
    setter(selected.includes(value) ? selected.filter((item) => item !== value) : [...selected, value]);
  };

  const onShortlist = async (playerId: string) => {
    if (!profile?.coach_id) {
      setStatus("Coach profile required to shortlist players.");
      return;
    }

    if (savedIds.includes(playerId)) {
      setSavedIds((prev) => prev.filter((id) => id !== playerId));
      return;
    }

    setSavedIds((prev) => [...prev, playerId]);
    const response = await fetch("/api/coach/shortlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ coachId: profile.coach_id, playerId }),
    });

    if (!response.ok) {
      setSavedIds((prev) => prev.filter((id) => id !== playerId));
      setStatus("Unable to update shortlist.");
      return;
    }

    setStatus("Shortlist updated.");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
      <aside className="rounded-xl border border-white/10 bg-[var(--surface)] p-4">
        <p className="text-sm font-semibold text-white">Filters</p>
        <div className="mt-4 space-y-4 text-sm text-white/80">
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-white/60">Graduation Year</p>
            <div className="flex flex-wrap gap-2">{["2026", "2027", "2028", "2029"].map((year) => <button key={year} onClick={() => toggleFilter(year, selectedYears, setSelectedYears)} className={`rounded-full px-2 py-1 text-xs ${selectedYears.includes(year) ? "bg-[var(--brand-primary)]" : "border border-white/20"}`}>{year}</button>)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-white/60">Position</p>
            <div className="flex flex-wrap gap-2">{["PG", "SG", "SF", "PF", "C"].map((pos) => <button key={pos} onClick={() => toggleFilter(pos, selectedPositions, setSelectedPositions)} className={`rounded-full px-2 py-1 text-xs ${selectedPositions.includes(pos) ? "bg-[var(--brand-primary)]" : "border border-white/20"}`}>{pos}</button>)}</div>
          </div>
          <div>
            <p className="mb-2 text-xs uppercase tracking-wide text-white/60">State</p>
            <div className="flex flex-wrap gap-2">{["GA", "TX", "FL", "NC", "IL"].map((state) => <button key={state} onClick={() => toggleFilter(state, selectedStates, setSelectedStates)} className={`rounded-full px-2 py-1 text-xs ${selectedStates.includes(state) ? "bg-[var(--brand-primary)]" : "border border-white/20"}`}>{state}</button>)}</div>
          </div>
          <label className="block">Height min (inches)
            <input type="range" min={60} max={84} value={heightMinInches} onChange={(e) => setHeightMinInches(Number(e.target.value))} className="mt-2 w-full" />
          </label>
          <label className="block">GPA min
            <input type="range" min={20} max={40} value={gpaMinTenths} onChange={(e) => setGpaMinTenths(Number(e.target.value))} className="mt-2 w-full" />
          </label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> Verified only</label>
          <label className="flex items-center gap-2"><input type="checkbox" checked={hasHighlights} onChange={(e) => setHasHighlights(e.target.checked)} /> Has highlights</label>
        </div>
      </aside>

      <section className="space-y-4">
        <div className="rounded-xl border border-white/10 bg-[var(--surface)] p-4">
          <div className="flex flex-wrap items-center gap-3">
            <SearchBar value={query} onChange={setQuery} placeholder="Search players" className="min-w-[220px] flex-1" />
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value as "relevance" | "grad" | "height" | "recent")} className="rounded-md border border-white/15 bg-black/40 px-3 py-2 text-sm text-white">
              <option value="relevance">Relevance</option>
              <option value="grad">Grad year</option>
              <option value="height">Height</option>
              <option value="recent">Recently active</option>
            </select>
            <div className="flex gap-2">
              <button onClick={() => setView("grid")} className={`rounded-md px-3 py-2 text-sm ${view === "grid" ? "bg-[var(--brand-primary)]" : "border border-white/20"}`}>Grid</button>
              <button onClick={() => setView("list")} className={`rounded-md px-3 py-2 text-sm ${view === "list" ? "bg-[var(--brand-primary)]" : "border border-white/20"}`}>List</button>
            </div>
          </div>
          <FilterBar filters={activeFilters} onRemove={(id) => {
            if (id.startsWith("year-")) {
              setSelectedYears((prev) => prev.filter((year) => `year-${year}` !== id));
              return;
            }
            if (id.startsWith("position-")) {
              setSelectedPositions((prev) => prev.filter((position) => `position-${position}` !== id));
              return;
            }
            if (id.startsWith("state-")) {
              setSelectedStates((prev) => prev.filter((state) => `state-${state}` !== id));
              return;
            }
            if (id === "verified") {
              setVerifiedOnly(false);
              return;
            }
            if (id === "highlights") {
              setHasHighlights(false);
              return;
            }
            if (id === "height") {
              setHeightMinInches(6);
              return;
            }
            if (id === "gpa") {
              setGpaMinTenths(30);
              return;
            }
          }} onClearAll={() => {
            setSelectedYears([]);
            setSelectedPositions([]);
            setSelectedStates([]);
            setVerifiedOnly(false);
            setHasHighlights(false);
            setHeightMinInches(6);
            setGpaMinTenths(30);
          }} className="mt-3" />
        </div>

        {paged.length === 0 ? <EmptyState title="No players found" description="Adjust filters to broaden your search." /> : (
          <div className={view === "grid" ? "grid gap-3 md:grid-cols-2 xl:grid-cols-3" : "space-y-3"}>
            {paged.map((player) => (
              <article key={player.id} className="rounded-xl border border-white/10 bg-[var(--surface)] p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2"><ProfileAvatar initials={player.name.split(" ").map((x) => x[0]).join("").slice(0,2)} size="sm" /><div><p className="text-sm font-semibold text-white">{player.name}</p><p className="text-xs text-white/60">{player.position} · {player.gradYear}</p></div></div>
                  <VerificationBadge state={player.verified ? "verified" : "unverified"} />
                </div>
                <p className="mt-2 text-xs text-white/70">{player.state} · {player.height}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button onClick={() => onShortlist(player.id)} className="rounded-md bg-[var(--brand-primary)] px-2.5 py-1.5 text-xs font-semibold text-white">
                    {savedIds.includes(player.id) ? "Shortlisted" : "Shortlist"}
                  </button>
                  <Link href={`/players/${player.id}`} className="rounded-md border border-white/20 px-2.5 py-1.5 text-xs text-white/80">
                    View profile
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}

        <PaginationControls page={page} totalPages={totalPages} onChange={setPage} />
        {status ? <p className="text-xs text-white/60">{status}</p> : null}
      </section>
    </div>
  );
}
