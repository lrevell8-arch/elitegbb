import Link from "next/link";

const navItems = [
  { href: "/about", label: "About" },
  { href: "/pricing", label: "Pricing" },
  { href: "/browse", label: "Browse Players" },
  { href: "/events", label: "Events" },
  { href: "/faq", label: "FAQ" },
];

export default function Navigation() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-black/80 backdrop-blur">
      <nav className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3 text-lg font-semibold text-white">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0b0b0b]">
            <span className="text-sm font-bold text-[#fb6c1d]">C</span>
          </span>
          <span className="tracking-tight">ConnectGBB</span>
        </Link>
        <div className="hidden items-center gap-6 text-sm text-white/70 md:flex">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} className="transition hover:text-white">
              {item.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href="/login" className="rounded-full border border-white/15 px-4 py-2 text-white/80">
            Member Login
          </Link>
          <Link
            href="/pricing"
            className="rounded-full bg-[#0134bd] px-4 py-2 font-medium text-white"
          >
            Join Now
          </Link>
        </div>
      </nav>
    </header>
  );
}
