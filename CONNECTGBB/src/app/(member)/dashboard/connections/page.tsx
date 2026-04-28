import { ConnectionsTabsClient } from "@/app/(member)/dashboard/_components/ConnectionsTabsClient";

const requests = [
  { id: "rq1", coachName: "Coach Avery Lewis", org: "River City Prep", message: "Can we schedule a quick intro call this week?" },
  { id: "rq2", coachName: "Coach Dana Mitchell", org: "Summit Hoops", message: "Interested in your latest game footage." },
];

const connected = [
  { id: "c1", coachName: "Coach Riley Brooks", org: "Metro Academy", message: "Great progress on your finishing package." },
];

const pending = [
  { id: "p1", coachName: "Coach Morgan Tate", org: "Westfield Elite", message: "Awaiting response to your request." },
];

export default function DashboardConnectionsPage() {
  return (
    <ConnectionsTabsClient
      requests={requests}
      connected={connected}
      pending={pending}
      needsParentApproval={true}
      underReview={true}
    />
  );
}
