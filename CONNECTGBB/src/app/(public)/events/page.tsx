"use client";

import { useMemo, useState } from "react";
import { EmptyState, ErrorState, FilterBar, SectionCard, StatusBadge } from "@/components/ui";
import { publicEvents } from "@/lib/adapters/events";

type PeriodFilter = "all" | "upcoming" | "past";

export default function EventsPage() {
  const [period, setPeriod] = useState<PeriodFilter>("upcoming");
  const [location, setLocation] = useState<string>("all");
  const [loadError] = useState<string | null>(null);

  const locations = Array.from(new Set(publicEvents.map((eventItem) => eventItem.location)));

  const events = useMemo(() => {
    return publicEvents.filter((eventItem) => {
      if (period !== "all" && eventItem.period !== period) return false;
      if (location !== "all" && eventItem.location !== location) return false;
      return true;
    });
  }, [period, location]);

  const activeFilters = [
    ...(period !== "all" ? [{ id: "period", label: `Period: ${period}` }] : []),
    ...(location !== "all" ? [{ id: "location", label: `Location: ${location}` }] : []),
  ];

  if (loadError) {
    return <ErrorState title="Unable to load events" description={loadError} />;
  }

  return (
    <div className="space-y-6">
      <SectionCard title="Events" description="Find upcoming clinics, showcases, and education sessions.">
        <div className="grid gap-3 md:grid-cols-2">
          <select
            value={period}
            onChange={(event) => setPeriod(event.target.value as PeriodFilter)}
            className="rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past</option>
          </select>
          <select
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            className="rounded-md border border-white/15 bg-black/30 px-3 py-2 text-sm text-white"
          >
            <option value="all">All locations</option>
            {locations.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </div>
        <FilterBar
          className="mt-3"
          filters={activeFilters}
          onRemove={(id) => {
            if (id === "period") setPeriod("all");
            if (id === "location") setLocation("all");
          }}
          onClearAll={() => {
            setPeriod("all");
            setLocation("all");
          }}
        />
      </SectionCard>

      {events.length === 0 ? (
        <EmptyState title="No upcoming events" description="No upcoming events. Check back soon." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {events.map((eventItem) => (
            <article key={eventItem.id} className="rounded-md border border-white/10 bg-[var(--surface)] p-4">
              <p className="text-sm font-semibold text-white">{eventItem.name}</p>
              <p className="mt-1 text-xs text-white/70">{eventItem.date} · {eventItem.location}</p>
              <p className="mt-2 text-xs text-white/60">{eventItem.type}</p>
              <div className="mt-3">
                <StatusBadge variant={eventItem.status === "Open" ? "active" : eventItem.status === "Waitlist" ? "pending" : "suspended"} />
              </div>
              <button type="button" className="mt-4 rounded-md bg-[var(--brand-primary)] px-3 py-2 text-xs font-semibold text-white">
                Register
              </button>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
