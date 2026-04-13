import Link from "next/link";

const footerLinks = [
  {
    title: "Platform",
    links: [
      { href: "/browse", label: "Browse Players" },
      { href: "/events", label: "Events" },
      { href: "/pricing", label: "Pricing" },
    ],
  },
  {
    title: "Community",
    links: [
      { href: "/dashboard", label: "Member Hub" },
      { href: "/faq", label: "FAQs" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About" },
      { href: "/privacy", label: "Privacy" },
      { href: "/terms", label: "Terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-black">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-12">
        <div className="grid gap-8 md:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="mb-4 flex items-center gap-3 text-lg font-semibold text-white">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-[#0b0b0b]">
                <span className="text-sm font-bold text-[#fb6c1d]">C</span>
              </span>
              ConnectGBB
            </div>
            <p className="text-sm text-white/60">
              The membership network for elite girls basketball training, recruiting visibility, and
              trusted connections.
            </p>
          </div>
          {footerLinks.map((group) => (
            <div key={group.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/50">
                {group.title}
              </p>
              <ul className="mt-4 space-y-3 text-sm text-white/70">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition hover:text-white">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-6 text-xs text-white/40 md:flex-row">
          <span>{new Date().getFullYear()} ConnectGBB. All rights reserved.</span>
          <div className="flex items-center gap-4">
            <span>Instagram @elitegbb</span>
            <span>info@elitegbb.com</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
