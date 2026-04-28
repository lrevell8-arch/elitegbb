// src/lib/adapters/events.ts
// ADAPTER: Replace implementations when Supabase schema is confirmed

import { getSupabaseClient } from "@/lib/supabaseClient";

export type EventItem = {
  id: string
  name: string
  date: string
  location: string
  type: "tournament" | "clinic" | "camp" | "showcase"
  status: "open" | "closing_soon" | "closed" | "full"
  period: "upcoming" | "past"
}

export async function getEvents(): Promise<EventItem[]> {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return publicEvents;
  }

  const { data, error } = await supabase
    .from("events")
    .select("id, name, date, location, type, status, period")
    .order("date", { ascending: true });

  if (error) {
    console.error("Failed to load events", error.message);
    return publicEvents;
  }

  return (data ?? []).map((event: any) => ({
    id: event.id,
    name: event.name ?? "Unnamed event",
    date: event.date ?? "TBD",
    location: event.location ?? "Unknown location",
    type: event.type ?? "showcase",
    status: event.status ?? "open",
    period: event.period ?? "upcoming",
  }));
}

// Mock data for public events
export const publicEvents: EventItem[] = [
  {
    id: "e1",
    name: "Elite Guard Skills Camp",
    date: "2026-06-15",
    location: "Atlanta, GA",
    type: "camp",
    status: "open",
    period: "upcoming",
  },
  {
    id: "e2",
    name: "Spring Showcase Tournament",
    date: "2026-05-20",
    location: "Charlotte, NC",
    type: "tournament",
    status: "closing_soon",
    period: "upcoming",
  },
  {
    id: "e3",
    name: "Defensive Fundamentals Clinic",
    date: "2026-04-10",
    location: "Nashville, TN",
    type: "clinic",
    status: "open",
    period: "upcoming",
  },
];
