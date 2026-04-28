import { StatusBadge } from "@/components/ui/StatusBadge";
import { getEvents, type EventItem } from "@/lib/adapters/events";
import { EmptyState } from "@/components/ui/EmptyState";

interface EventCardProps {
  event: EventItem;
}

function EventCard({ event }: EventCardProps) {
  const statusColors = {
    open: "success",
    closing_soon: "warning",
    closed: "error",
    full: "error",
  } as const;

  return (
    <div className="bg-[var(--surface)] border border-white/10 rounded-lg p-6">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-[var(--foreground)] mb-2">{event.name}</h3>
        <div className="flex items-center gap-2 text-sm text-[var(--foreground)]/80 mb-2">
          <span>{event.date}</span>
          <span>•</span>
          <span>{event.location}</span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge variant="default">{event.type}</StatusBadge>
          <StatusBadge variant={statusColors[event.status]}>
            {event.status.replace("_", " ")}
          </StatusBadge>
        </div>
      </div>
      <button
        className="w-full bg-[var(--brand-primary)] text-white py-2 px-4 rounded-lg font-medium hover:bg-[var(--brand-primary)]/90 transition-colors"
        disabled={event.status === "closed" || event.status === "full"}
      >
        {event.status === "open" ? "Register" : event.status === "closing_soon" ? "Register Soon" : event.status === "full" ? "Full" : "Closed"}
      </button>
    </div>
  );
}

export default async function EventsPage() {
  const events = await getEvents();

  // For now, show all, but in real app filter by upcoming/past
  const filteredEvents = events;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Filter Bar */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <button className="px-4 py-2 bg-[var(--brand-primary)] text-white rounded-lg font-medium">
            Upcoming
          </button>
          <button className="px-4 py-2 bg-[var(--surface)] border border-white/10 text-[var(--foreground)] rounded-lg font-medium hover:bg-[var(--surface-muted)]">
            Past
          </button>
        </div>
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Filter by location..."
            className="flex-1 bg-[var(--surface)] border border-white/10 rounded-lg px-4 py-2 text-[var(--foreground)] placeholder-[var(--foreground)]/60"
          />
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <EmptyState
          title="No upcoming events scheduled"
          description="Check back soon for new events."
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredEvents.map(event => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
