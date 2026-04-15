"use client";

import AuthGuard from "@/components/AuthGuard";
import { RoleLayoutShell } from "@/components/layout/RoleLayoutShell";

const adminGroups = [
  {
    label: "Overview",
    items: [{ href: "/admin", label: "Dashboard", icon: "🏠" }],
  },
  {
    label: "Management",
    items: [
      { href: "/admin/members", label: "Members", icon: "👥" },
      { href: "/admin/moderation", label: "Moderation", icon: "🛡️" },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/admin/reports", label: "Reports", icon: "📊" },
      { href: "/admin/settings", label: "Settings", icon: "⚙️" },
    ],
  },
];

const adminNav = adminGroups.flatMap((group) => group.items);

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["admin"]}>
      <RoleLayoutShell
        title="Admin Operations"
        navItems={adminNav}
        navGroups={adminGroups}
        alertBanner="System notice slot: monitor platform status, moderation spikes, and billing alerts here."
      >
        {children}
      </RoleLayoutShell>
    </AuthGuard>
  );
}
