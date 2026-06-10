"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings } from "lucide-react";

const LINKS = [
  { href: "/videos", label: "Videos" },
  { href: "/breeding", label: "Breeding" },
  { href: "/photos", label: "Photos" },
  { href: "/#reservations", label: "Reservations" },
];

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-40 hidden md:flex items-center justify-between px-6 h-16"
      style={{ background: "var(--bg-base)cc", backdropFilter: "blur(12px)", borderBottom: "1px solid var(--border)" }}>
      <Link href="/" className="font-bold text-lg tracking-widest uppercase" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
        RDD <span style={{ color: "var(--accent)" }}>GAMEFARM</span>
      </Link>
      <div className="flex items-center gap-6">
        {LINKS.map(({ href, label }) => (
          <Link key={href} href={href}
            className="text-sm font-medium transition-colors"
            style={{ color: pathname.startsWith(href.replace("/#", "")) ? "var(--accent)" : "var(--text-muted)" }}>
            {label}
          </Link>
        ))}
        <Link href="/admin" className="p-2 rounded-lg transition-colors" style={{ color: "var(--text-muted)" }} title="Admin">
          <Settings size={18} />
        </Link>
      </div>
    </nav>
  );
}
