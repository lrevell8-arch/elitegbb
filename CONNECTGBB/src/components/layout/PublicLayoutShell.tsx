"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";

const navLinks = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/browse", label: "Browse" },
  { href: "/events", label: "Events" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export interface PublicLayoutShellProps {
  children: React.ReactNode;
}

export function PublicLayoutShell({ children }: PublicLayoutShellProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen flex-col bg-[var(--background)] text-[var(--foreground)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[var(--background)]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-4 md:px-6">
          <Link href="/" className="text-lg font-semibold tracking-tight">ConnectGBB</Link>
          <nav className="hidden items-center gap-6 text-sm text-white/75 md:flex">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="transition hover:text-white">
                {link.label}
              </Link>
            ))}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Link href="/login" className="rounded-md border border-white/20 px-3 py-2 text-sm text-white/85">
              Login
            </Link>
            <Link href="/pricing" className="rounded-md bg-[var(--brand-primary)] px-3 py-2 text-sm font-semibold text-white">
              Join
            </Link>
          </div>
          <button
            type="button"
            onClick={() => setMenuOpen((prev) => !prev)}
            className="rounded-md border border-white/20 px-3 py-2 text-sm md:hidden"
            aria-expanded={menuOpen}
            aria-label="Toggle menu"
          >
            Menu
          </button>
        </div>
      </header>

      <div className={cn("fixed inset-0 z-50 bg-black/60 transition md:hidden", menuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0")}
        onClick={() => setMenuOpen(false)}
      >
        <aside
          className={cn(
            "ml-auto h-full w-72 border-l border-white/10 bg-[var(--surface)] p-5 transition-transform",
            menuOpen ? "translate-x-0" : "translate-x-full"
          )}
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex items-center justify-between">
            <p className="text-base font-semibold">Navigation</p>
            <button type="button" onClick={() => setMenuOpen(false)} className="text-sm text-white/70">Close</button>
          </div>
          <nav className="mt-5 flex flex-col gap-2">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className="rounded-md px-3 py-2 text-sm text-white/85 hover:bg-white/10" onClick={() => setMenuOpen(false)}>
                {link.label}
              </Link>
            ))}
            <div className="mt-3 border-t border-white/10 pt-3">
              <Link href="/login" className="block rounded-md px-3 py-2 text-sm text-white/85" onClick={() => setMenuOpen(false)}>
                Login
              </Link>
              <Link href="/pricing" className="mt-2 block rounded-md bg-[var(--brand-primary)] px-3 py-2 text-sm font-semibold text-white" onClick={() => setMenuOpen(false)}>
                Join Membership
              </Link>
            </div>
          </nav>
        </aside>
      </div>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-4 py-8 md:px-6">{children}</main>

      <footer className="border-t border-white/10 bg-[var(--surface)]">
        <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-4 py-10 md:grid-cols-4 md:px-6">
          <div className="md:col-span-1">
            <p className="text-lg font-semibold">ConnectGBB</p>
            <p className="mt-2 text-sm text-white/65">Elite girls basketball development, visibility, and trusted communication.</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Platform</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-white/75">
              <Link href="/browse">Browse</Link>
              <Link href="/events">Events</Link>
              <Link href="/pricing">Pricing</Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Community</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-white/75">
              <Link href="/faq">FAQ</Link>
              <Link href="/contact">Contact</Link>
              <Link href="/dashboard">Member Hub</Link>
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-white/50">Legal</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-white/75">
              <Link href="/privacy">Privacy</Link>
              <Link href="/terms">Terms</Link>
              <span>Instagram @elitegbb</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
