"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { ProfileAvatar } from "@/components/ui";

export interface RoleNavItem {
  href: string;
  label: string;
  icon?: string;
}

export interface RoleNavGroup {
  label: string;
  items: RoleNavItem[];
}

export interface RoleLayoutShellProps {
  children: React.ReactNode;
  title: string;
  navItems: RoleNavItem[];
  navGroups?: RoleNavGroup[];
  verificationBanner?: string;
  alertBanner?: string;
  showBottomTabs?: boolean;
}

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function RoleLayoutShell({
  children,
  title,
  navItems,
  navGroups,
  verificationBanner,
  alertBanner,
  showBottomTabs = true,
}: RoleLayoutShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const bottomTabs = useMemo(() => navItems.slice(0, 5), [navItems]);

  const breadcrumb = pathname
    .split("/")
    .filter(Boolean)
    .map((segment) => segment[0]?.toUpperCase() + segment.slice(1))
    .join(" / ");

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
      <div className="flex min-h-screen">
        <aside className="hidden w-72 flex-col border-r border-white/10 bg-[var(--surface)] lg:flex">
          <div className="border-b border-white/10 p-5">
            <Link href="/" className="text-lg font-semibold">ConnectGBB</Link>
          </div>
          <nav className="flex-1 space-y-6 overflow-y-auto p-4">
            {navGroups?.length
              ? navGroups.map((group) => (
                  <div key={group.label}>
                    <p className="mb-2 text-xs uppercase tracking-[0.2em] text-white/45">{group.label}</p>
                    <div className="space-y-1">
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          className={cn(
                            "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                            isActive(pathname, item.href)
                              ? "bg-[var(--brand-primary)]/25 text-white"
                              : "text-white/75 hover:bg-white/10"
                          )}
                        >
                          {item.icon ? <span className="text-xs">{item.icon}</span> : null}
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  </div>
                ))
              : navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm transition",
                      isActive(pathname, item.href)
                        ? "bg-[var(--brand-primary)]/25 text-white"
                        : "text-white/75 hover:bg-white/10"
                    )}
                  >
                    {item.icon ? <span className="text-xs">{item.icon}</span> : null}
                    <span>{item.label}</span>
                  </Link>
                ))}
          </nav>
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center justify-between rounded-md bg-black/30 p-2">
              <div>
                <p className="text-xs text-white/55">Signed in</p>
                <p className="text-sm font-medium">Member</p>
              </div>
              <ProfileAvatar initials="CG" size="sm" online />
            </div>
          </div>
        </aside>

        <div className="flex min-h-screen flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-white/10 bg-[var(--background)]/95 backdrop-blur">
            <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-6">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setMenuOpen((prev) => !prev)}
                  className="rounded-md border border-white/20 px-3 py-2 text-xs lg:hidden"
                >
                  Menu
                </button>
                <div>
                  <p className="text-sm font-semibold">{title}</p>
                  <p className="text-xs text-white/55">{breadcrumb || "Overview"}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="button" className="rounded-md border border-white/20 px-3 py-2 text-xs">
                  Alerts
                </button>
                <ProfileAvatar initials="CG" size="sm" />
              </div>
            </div>
            {alertBanner ? <div className="border-t border-white/10 bg-[var(--brand-secondary)]/20 px-4 py-2 text-xs text-white md:px-6">{alertBanner}</div> : null}
            {verificationBanner ? (
              <div className="border-t border-white/10 bg-[var(--brand-secondary)]/20 px-4 py-2 text-xs text-white md:px-6">
                {verificationBanner}
              </div>
            ) : null}
          </header>

          <div className={cn("fixed inset-0 z-40 bg-black/60 transition lg:hidden", menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")} onClick={() => setMenuOpen(false)}>
            <aside
              className={cn(
                "h-full w-72 border-r border-white/10 bg-[var(--surface)] p-4 transition-transform",
                menuOpen ? "translate-x-0" : "-translate-x-full"
              )}
              onClick={(event) => event.stopPropagation()}
            >
              <p className="mb-3 text-sm font-semibold">Navigate</p>
              <div className="space-y-1">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
                      isActive(pathname, item.href)
                        ? "bg-[var(--brand-primary)]/25 text-white"
                        : "text-white/75 hover:bg-white/10"
                    )}
                  >
                    {item.icon ? <span className="text-xs">{item.icon}</span> : null}
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>
            </aside>
          </div>

          <main className="flex-1 px-4 py-6 pb-24 md:px-6 lg:pb-6">{children}</main>

          {showBottomTabs ? (
            <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-5 border-t border-white/10 bg-[var(--surface)] lg:hidden">
              {bottomTabs.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "px-2 py-3 text-center text-[11px]",
                    isActive(pathname, item.href) ? "text-white" : "text-white/60"
                  )}
                >
                  <div>{item.icon ?? "•"}</div>
                  <div>{item.label}</div>
                </Link>
              ))}
            </nav>
          ) : null}
        </div>
      </div>
    </div>
  );
}
