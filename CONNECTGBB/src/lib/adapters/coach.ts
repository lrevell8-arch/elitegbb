import { getPublicPlayers, type PublicPlayer } from "@/lib/adapters/players";

export interface CoachDashboardData {
  verified: boolean;
  lastActiveLabel: string;
  stats: Array<{ label: string; value: string; delta: string }>;
  recentSearches: Array<{ id: string; query: string; createdAt: string }>;
  shortlistPreview: PublicPlayer[];
  messageActivity: Array<{ id: string; name: string; preview: string; timestamp: string; unread: number }>;
  suggestedProspects: PublicPlayer[];
}

export interface CoachConversation {
  id: string;
  playerName: string;
  initials: string;
  profileHref: string;
  lastPreview: string;
  timestamp: string;
  unread: number;
  pendingParentApproval: boolean;
  underReview: boolean;
  moderationHold: boolean;
  messages: Array<{ id: string; sender: "coach" | "player"; text: string; sentAt: string }>;
}

export async function getCoachDashboardData(): Promise<CoachDashboardData> {
  const players = await getPublicPlayers();

  return {
    verified: false,
    lastActiveLabel: "April 15, 2026",
    stats: [
      { label: "Searches This Month", value: "42", delta: "+8 vs last month" },
      { label: "Players Shortlisted", value: "17", delta: "+3 this week" },
      { label: "Messages Sent", value: "29", delta: "+6 this week" },
      { label: "Profile Views", value: "88", delta: "+11 this week" },
    ],
    recentSearches: [
      { id: "s1", query: "2027 PG Georgia verified", createdAt: "2026-04-15 09:12" },
      { id: "s2", query: "2028 SG Texas GPA 3.5+", createdAt: "2026-04-14 18:20" },
      { id: "s3", query: "Florida perimeter defenders", createdAt: "2026-04-14 07:10" },
      { id: "s4", query: "2027 shooters with highlights", createdAt: "2026-04-13 16:45" },
      { id: "s5", query: "North Carolina guards", createdAt: "2026-04-12 13:37" },
    ],
    shortlistPreview: players.slice(0, 4),
    messageActivity: [
      { id: "m1", name: "Player One", preview: "Thanks Coach, I can share new film tonight.", timestamp: "1h ago", unread: 2 },
      { id: "m2", name: "Player Two", preview: "My parent approved the request.", timestamp: "3h ago", unread: 0 },
      { id: "m3", name: "Player Four", preview: "Would next Tuesday work for a call?", timestamp: "Yesterday", unread: 1 },
    ],
    suggestedProspects: players.slice(1, 5),
  };
}

export async function getCoachConversations(): Promise<CoachConversation[]> {
  return [
    {
      id: "c1",
      playerName: "Player One",
      initials: "PO",
      profileHref: "/browse",
      lastPreview: "Thanks Coach, I can share new film tonight.",
      timestamp: "10:24 AM",
      unread: 2,
      pendingParentApproval: false,
      underReview: false,
      moderationHold: false,
      messages: [
        { id: "msg1", sender: "player", text: "Coach, thank you for reaching out.", sentAt: "09:45" },
        { id: "msg2", sender: "coach", text: "Great to connect. Could you send your latest highlights?", sentAt: "10:02" },
      ],
    },
    {
      id: "c2",
      playerName: "Player Two",
      initials: "PT",
      profileHref: "/browse",
      lastPreview: "My parent approved the request.",
      timestamp: "Yesterday",
      unread: 0,
      pendingParentApproval: true,
      underReview: false,
      moderationHold: false,
      messages: [
        { id: "msg3", sender: "player", text: "Parent approval is in progress.", sentAt: "Yesterday" },
      ],
    },
    {
      id: "c3",
      playerName: "Player Four",
      initials: "PF",
      profileHref: "/browse",
      lastPreview: "Would next Tuesday work for a call?",
      timestamp: "Monday",
      unread: 1,
      pendingParentApproval: false,
      underReview: true,
      moderationHold: true,
      messages: [
        { id: "msg4", sender: "coach", text: "Happy to discuss your development goals.", sentAt: "Monday" },
      ],
    },
  ];
}
