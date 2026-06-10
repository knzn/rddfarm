"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Play, Bird, Camera, BookOpen } from "lucide-react";

const TABS = [
  { href: "/", label: "Home", icon: Home, exact: true },
  { href: "/videos", label: "Videos", icon: Play },
  { href: "/breeding", label: "Breeding", icon: Bird },
  { href: "/photos", label: "Photos", icon: Camera },
  { href: "/#reservations", label: "Reserve", icon: BookOpen },
];

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 flex md:hidden"
      style={{ background: "var(--bg-surface)", borderTop: "1px solid var(--border)" }}>
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link key={href} href={href} className="flex-1 flex flex-col items-center justify-center py-3 gap-0.5 transition-colors"
            style={{ color: active ? "var(--accent)" : "var(--text-faint)" }}>
            <Icon size={20} />
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
