export const ROLE_KEYS = ["player", "parent", "coach", "organizer", "admin"] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const ROLE_LABELS: Record<RoleKey, string> = {
  player: "Player",
  parent: "Parent",
  coach: "Coach",
  organizer: "Organizer",
  admin: "Admin",
};

export const ROLE_DASHBOARD_PATH: Record<RoleKey, string> = {
  player: "/dashboard",
  parent: "/dashboard",
  coach: "/coach",
  organizer: "/events",
  admin: "/admin",
};
