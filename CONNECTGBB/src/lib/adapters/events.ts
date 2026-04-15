export interface PublicEvent {
  id: string;
  name: string;
  date: string;
  location: string;
  type: "Clinic" | "Showcase" | "Webinar";
  status: "Open" | "Waitlist" | "Closed";
  period: "upcoming" | "past";
}

export const publicEvents: PublicEvent[] = [
  {
    id: "e1",
    name: "Elite Guard Skills Camp",
    date: "2026-05-10",
    location: "Atlanta, GA",
    type: "Clinic",
    status: "Open",
    period: "upcoming",
  },
  {
    id: "e2",
    name: "Recruiting Visibility Webinar",
    date: "2026-05-18",
    location: "Virtual",
    type: "Webinar",
    status: "Open",
    period: "upcoming",
  },
  {
    id: "e3",
    name: "Summer Prospect Showcase",
    date: "2026-06-01",
    location: "Dallas, TX",
    type: "Showcase",
    status: "Waitlist",
    period: "upcoming",
  },
  {
    id: "e4",
    name: "Spring Fundamentals Clinic",
    date: "2026-03-01",
    location: "Orlando, FL",
    type: "Clinic",
    status: "Closed",
    period: "past",
  },
];
