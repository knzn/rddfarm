"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import {
  LayoutDashboard, Upload, BookOpen, Dumbbell, DollarSign,
  ShoppingCart, Users, Settings, Image, LogOut, Menu, X,
} from "lucide-react";

const NAV = [
  { href: "/admin",               label: "Dashboard",    icon: LayoutDashboard, exact: true },
  { href: "/admin/upload",        label: "Upload",       icon: Upload },
  { href: "/admin/media",         label: "Manage Media", icon: Image },
  { href: "/admin/reservations",  label: "Reservations", icon: BookOpen },
  { href: "/admin/breeding",      label: "Breeding",     icon: Dumbbell },
  { href: "/admin/expenses",      label: "Expenses",     icon: DollarSign },
  { href: "/admin/sales",         label: "Sales",        icon: ShoppingCart },
  { href: "/admin/workers",       label: "Workers",      icon: Users },
  { href: "/admin/jumbotron",     label: "Jumbotron",    icon: Image },
  { href: "/admin/settings",      label: "Settings",     icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  // Close drawer on route change
  useEffect(() => { setOpen(false); }, [pathname]);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  const sidebarContent = (
    <>
      <div className="px-6 py-5 border-b flex items-center justify-between" style={{ borderColor: "var(--border)" }}>
        <div>
          <span className="font-bold text-lg tracking-wider" style={{ color: "var(--accent)", fontFamily: "var(--font-heading)" }}>
            RDD GAMEFARM
          </span>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>Admin Panel</p>
        </div>
        {/* Close button — mobile only */}
        <button onClick={() => setOpen(false)} className="md:hidden p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}>
          <X size={18} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {NAV.map(({ href, label, icon: Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link key={href} href={href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all"
              style={{
                background: active ? "var(--accent-glow)" : "transparent",
                color: active ? "var(--accent)" : "var(--text-muted)",
                borderLeft: active ? "2px solid var(--accent)" : "2px solid transparent",
              }}>
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t" style={{ borderColor: "var(--border)" }}>
        <button onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm w-full transition-all hover:opacity-80"
          style={{ color: "var(--danger)" }}>
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar — always visible md+ */}
      <aside className="hidden md:flex fixed top-0 left-0 h-full w-[260px] flex-col border-r z-30"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        {sidebarContent}
      </aside>

      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-4 h-14 border-b"
        style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <button onClick={() => setOpen(true)} className="p-2 rounded-lg" style={{ color: "var(--text-muted)" }}>
          <Menu size={20} />
        </button>
        <span className="font-bold tracking-wider text-sm" style={{ color: "var(--accent)", fontFamily: "var(--font-heading)" }}>
          RDD GAMEFARM
        </span>
        <div className="w-9" /> {/* spacer to center title */}
      </div>

      {/* Mobile drawer backdrop */}
      {open && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Dark overlay */}
          <div className="absolute inset-0 bg-black/60" onClick={() => setOpen(false)} />
          {/* Drawer panel */}
          <aside className="relative z-50 w-[260px] flex flex-col h-full border-r"
            style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
