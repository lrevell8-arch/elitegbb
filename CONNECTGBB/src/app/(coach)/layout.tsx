"use client";

import AuthGuard from "@/components/AuthGuard";
import { RoleLayoutShell } from "@/components/layout/RoleLayoutShell";

const coachNav = [
  { href: "/coach", label: "Dashboard", icon: "🏠" },
  { href: "/coach/search", label: "Search", icon: "🔎" },
  { href: "/coach/shortlist", label: "Shortlist", icon: "📌" },
  { href: "/coach/messages", label: "Messages", icon: "✉️" },
  { href: "/coach/profile", label: "Profile", icon: "👤" },
];

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard allowedRoles={["coach"]}>
      <RoleLayoutShell
        title="Coach Workspace"
        navItems={coachNav}
        verificationBanner="Verification pending: complete program profile details to unlock full recruiting workflows."
      >
        {children}
      </RoleLayoutShell>
    </AuthGuard>
  );
}
