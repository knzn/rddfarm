"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Bird, Camera, ArrowRight, Calendar } from "lucide-react";

interface Listing {
  _id: string; name: string; slug: string; type: string;
  releaseMonthStart: number; releaseMonthEnd: number; releaseYear: number;
  bloodlines: { name: string; closed: boolean }[];
  createdAt: string;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function fmtRelease(l: Listing) {
  const start = MONTHS[l.releaseMonthStart - 1];
  const end = MONTHS[l.releaseMonthEnd - 1];
  return start === end ? `${start} ${l.releaseYear}` : `${start} – ${end} ${l.releaseYear}`;
}

const SECTIONS = [
  { href: "/videos",   label: "Fight Videos",       desc: "Watch our roosters in action",          icon: Play,   accent: "var(--accent)",  page: "videos",   defaultBg: "https://tiknok-media.sgp1.cdn.digitaloceanspaces.com/portfolio/photos/win1-7c46cdc9-af7c-4d77-bb75-93f5bd628564.webp" },
  { href: "/breeding", label: "Breeding Materials", desc: "Photos & videos of our breeding stock", icon: Bird,   accent: "var(--success)", page: "breeding", defaultBg: "https://tiknok-media.sgp1.cdn.digitaloceanspaces.com/portfolio/photos/breed-611e7cbb-3224-4f76-a5f7-2092f4c4085c.webp" },
  { href: "/photos",   label: "Photos",             desc: "Our gamefarm gallery",                  icon: Camera, accent: "var(--warning)", page: "photos",   defaultBg: "https://tiknok-media.sgp1.cdn.digitaloceanspaces.com/portfolio/photos/baki-a4111d4c-41ef-4297-90c4-503b179187d8.webp" },
];

const TYPE_LABELS: Record<string, string> = {
  pahulugan: "Pahulugan",
  "months-old": "Months Old",
  "day-old": "Day Old",
};

const TYPE_ICONS: Record<string, string> = {
  pahulugan: "💰",
  "months-old": "🐓",
  "day-old": "🐣",
};

function ListingCard({ l }: { l: Listing }) {
  const isNew = (Date.now() - new Date(l.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
  const openBloodlines = l.bloodlines.filter((b) => !b.closed);
  const closedBloodlines = l.bloodlines.filter((b) => b.closed);
  const shownOpen = openBloodlines.slice(0, 3);
  const moreOpen = openBloodlines.length - shownOpen.length;
  const href = `/${l.type}/${l.slug}`;
  const accent = TYPE_ACCENT[l.type];

  return (
    <Link href={href}
      className="block rounded-[14px] overflow-hidden transition-all duration-200 hover:-translate-y-1 group"
      style={{
        width: 300,
        background: "var(--bg-surface)",
        border: `1px solid var(--border)`,
        borderTop: `3px solid ${accent}`,
      }}>
      <div className="p-5">

        {/* Row 1 — type label + NEW badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: accent }}>
            {TYPE_ICONS[l.type]} {TYPE_LABELS[l.type]}
          </span>
          {isNew && (
            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
              style={{ background: accent, color: "#fff" }}>
              NEW
            </span>
          )}
        </div>

        {/* Row 2 — listing name */}
        <p className="text-2xl font-bold leading-tight mb-4"
          style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
          {l.name}
        </p>

        {/* Row 3 — release date box */}
        <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <Calendar size={13} style={{ color: "var(--text-faint)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Release:</span>
          <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{fmtRelease(l)}</span>
        </div>

        {/* Row 4 — bloodlines */}
        <div className="space-y-1.5 mb-4">
          {shownOpen.map((b) => (
            <div key={b.name} className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ background: "var(--bg-raised)" }}>
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{b.name}</span>
              <span className="text-xs font-bold" style={{ color: "var(--success)" }}>Open</span>
            </div>
          ))}
          {closedBloodlines.slice(0, 2).map((b) => (
            <div key={b.name} className="flex items-center justify-between rounded-lg px-3 py-2"
              style={{ background: "var(--bg-raised)" }}>
              <span className="text-sm" style={{ color: "var(--text-faint)" }}>{b.name}</span>
              <span className="text-xs font-bold" style={{ color: "var(--danger)" }}>Full</span>
            </div>
          ))}
          {moreOpen > 0 && (
            <p className="text-xs px-3" style={{ color: "var(--text-faint)" }}>+{moreOpen} more open</p>
          )}
        </div>

        {/* Row 5 — CTA */}
        <div className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-widest transition-all duration-200 group-hover:gap-3"
          style={{ color: accent }}>
          Reserve Now <ArrowRight size={13} />
        </div>

      </div>
    </Link>
  );
}

const TYPE_ACCENT: Record<string, string> = {
  pahulugan: "var(--accent)",
  "months-old": "var(--success)",
  "day-old": "var(--warning)",
};

function SectionCards({ bgImages }: { bgImages: Record<string, string> }) {
  return (
    <section className="px-4 md:px-16 pt-8 pb-14">
      {/* Section header */}
      <div className="flex items-center gap-4 mb-6">
        <span className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: "var(--accent)" }}>Explore</span>
        <div className="flex-1 h-px" style={{ background: "var(--border)" }} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {SECTIONS.map((s, i) => {
          const bg = bgImages[s.page] || s.defaultBg;
          return (
            <Link key={s.href} href={s.href}
              className="relative rounded-[14px] overflow-hidden group transition-all duration-500 hover:-translate-y-2"
              style={{
                height: 320,
                border: `1px solid var(--border)`,
                background: bg ? `url('${bg}') center/cover no-repeat var(--bg-surface)` : "var(--bg-surface)",
                boxShadow: "0 4px 24px rgba(0,0,0,0.4)",
              }}>
              {/* Dark gradient */}
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top, rgba(8,11,20,0.97) 0%, rgba(8,11,20,0.5) 50%, rgba(8,11,20,0.15) 100%)" }} />
              {/* Accent glow on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                style={{ background: `linear-gradient(to top, ${s.accent}35 0%, transparent 55%)` }} />
              {/* Accent border sweep */}
              <div className="absolute inset-x-0 bottom-0 h-[3px] scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"
                style={{ background: s.accent }} />
              {/* Number badge */}
              <div className="absolute top-4 right-4 font-mono text-xs font-bold opacity-30 group-hover:opacity-70 transition-opacity duration-300"
                style={{ color: s.accent }}>
                {String(i + 1).padStart(2, "0")}
              </div>

              {/* Content */}
              <div className="absolute inset-0 flex flex-col justify-end p-6">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${s.accent}20`, border: `1px solid ${s.accent}45` }}>
                  <s.icon size={18} style={{ color: s.accent }} />
                </div>
                <h3 className="text-3xl font-bold uppercase leading-tight mb-1.5 transition-transform duration-300 group-hover:translate-x-1"
                  style={{ fontFamily: "var(--font-heading)", color: "#fff" }}>
                  {s.label}
                </h3>
                <p className="text-xs mb-4 leading-relaxed" style={{ color: "var(--text-muted)" }}>{s.desc}</p>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wide transition-all duration-300 group-hover:gap-4"
                  style={{ color: s.accent }}>
                  Explore <ArrowRight size={13} />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function LandingClient() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [bgImages, setBgImages] = useState<Record<string, string>>(
    Object.fromEntries(SECTIONS.map((s) => [s.page, s.defaultBg]))
  );

  useEffect(() => {
    fetch("/api/listings?active=true")
      .then((r) => r.json())
      .then((j) => setListings(j.data ?? []));

    SECTIONS.forEach(({ page, defaultBg }) => {
      if (defaultBg) return;
      fetch(`/api/media?page=${page}&type=photo&limit=1`)
        .then((r) => r.json())
        .then((j) => {
          const item = j.data?.[0];
          const url = item?.thumbnail ?? item?.url;
          if (url) setBgImages((prev) => ({ ...prev, [page]: url }));
        });
    });
  }, []);

  const byType = (type: string) => listings.filter((l) => l.type === type);

  return (
    <div style={{ background: "var(--bg-base)" }}>
      <SectionCards bgImages={bgImages} />

      {listings.length > 0 && (
        <section id="reservations" className="pb-16">
          <div className="flex items-center gap-4 mb-6 px-4 md:px-16">
            <div>
              <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                Available Orders
              </h2>
              <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Select a listing to reserve your bird</p>
            </div>
            <div className="flex-1 h-px ml-4" style={{ background: "var(--border)" }} />
          </div>
          <div className="flex flex-wrap justify-center gap-4 px-4 md:px-16 pb-3">
            {["pahulugan", "months-old", "day-old"].flatMap((type) =>
              byType(type).map((l) => <ListingCard key={l._id} l={l} />)
            )}
          </div>
        </section>
      )}
    </div>
  );
}
