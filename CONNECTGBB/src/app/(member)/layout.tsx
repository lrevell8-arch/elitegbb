"use client";

import AuthGuard from "@/components/AuthGuard";
import { RoleLayoutShell } from "@/components/layout/RoleLayoutShell";

const memberNav = [
  { href: "/dashboard", label: "Dashboard", icon: "🏠" },
  { href: "/dashboard/profile", label: "Profile", icon: "👤" },
  { href: "/dashboard/training", label: "Training", icon: "🎯" },
  { href: "/dashboard/progress", label: "Progress", icon: "📈" },
  { href: "/dashboard/connections", label: "Connections", icon: "💬" },
  { href: "/dashboard/saved", label: "Saved", icon: "⭐" },
];

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["player", "parent"]}>
      <RoleLayoutShell title="Member Workspace" navItems={memberNav}>
        {children}
      </RoleLayoutShell>
    </AuthGuard>
  );
}
