"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  BookOpen,
  Dumbbell,
  DollarSign,
  ShoppingCart,
  Users,
  Settings,
  Image,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/upload", label: "Upload", icon: Upload },
  { href: "/admin/media", label: "Manage Media", icon: Image },
  { href: "/admin/reservations", label: "Reservations", icon: BookOpen },
  { href: "/admin/breeding", label: "Breeding", icon: Dumbbell },
  { href: "/admin/expenses", label: "Expenses", icon: DollarSign },
  { href: "/admin/sales", label: "Sales", icon: ShoppingCart },
  { href: "/admin/workers", label: "Workers", icon: Users },
  { href: "/admin/jumbotron", label: "Jumbotron", icon: Image, exact: false },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <aside className="fixed top-0 left-0 h-full w-[260px] flex flex-col border-r z-30"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <div className="px-6 py-5 border-b" style={{ borderColor: "var(--border)" }}>
        <span className="font-heading font-bold text-lg tracking-wider" style={{ color: "var(--accent)", fontFamily: "var(--font-heading)" }}>
          RDD GAMEFARM
        </span>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Admin Panel</p>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: active ? "var(--accent-glow)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-muted)",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              }}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all hover:opacity-80"
          style={{ color: "var(--danger)" }}
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  );
}
