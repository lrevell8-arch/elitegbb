"use client";

import AuthGuard from "@/components/AuthGuard";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["player", "parent"]}>{children}</AuthGuard>;
}
