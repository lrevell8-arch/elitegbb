"use client";

import AuthGuard from "@/components/AuthGuard";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <AuthGuard allowedRoles={["coach"]}>{children}</AuthGuard>;
}
