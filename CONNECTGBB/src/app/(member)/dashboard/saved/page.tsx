import { SavedTabsClient } from "@/app/(member)/dashboard/_components/SavedTabsClient";

const savedPlayers = [
  { id: "sp1", title: "Player One · 2027 PG", href: "/browse" },
  { id: "sp2", title: "Player Four · 2027 PF", href: "/browse" },
];

const savedTraining = [
  { id: "st1", title: "Pressure Ball Handling Series", href: "/dashboard/training" },
  { id: "st2", title: "Defensive Angles & Footwork", href: "/dashboard/training" },
];

const savedEvents = [
  { id: "se1", title: "Elite Guard Skills Camp", href: "/events" },
];

export default function DashboardSavedPage() {
  return (
    <SavedTabsClient players={savedPlayers} training={savedTraining} events={savedEvents} />
  );
}
