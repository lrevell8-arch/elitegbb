export const ROUTE_GROUPS = {
  public: ["/", "/about", "/pricing", "/browse", "/events", "/faq", "/contact"],
  playerParent: [
    "/dashboard",
    "/dashboard/profile",
    "/dashboard/training",
    "/dashboard/progress",
    "/dashboard/connections",
    "/dashboard/saved",
  ],
  coach: ["/coach", "/coach/search", "/coach/shortlist", "/coach/messages", "/coach/profile"],
  admin: ["/admin", "/admin/members", "/admin/moderation", "/admin/reports", "/admin/settings"],
  auth: ["/login", "/onboarding", "/billing"],
};
