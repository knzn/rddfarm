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
  const closedCount = l.bloodlines.length - openBloodlines.length;
  const href = `/${l.type}/${l.slug}`;
  const accent = TYPE_ACCENT[l.type];

  return (
    <Link href={href}
      className="shrink-0 w-64 rounded-[14px] overflow-hidden transition-all duration-300 hover:-translate-y-1 group"
      style={{ background: "var(--bg-surface)", border: `1px solid var(--border)` }}>
      {/* Accent top bar */}
      <div className="h-[3px] w-full" style={{ background: `linear-gradient(to right, ${accent}, transparent)` }} />
      <div className="p-4">
        {/* Type badge + name */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full"
                style={{ background: `${accent}20`, color: accent }}>
                {TYPE_ICONS[l.type]} {TYPE_LABELS[l.type]}
              </span>
              {isNew && (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                  style={{ background: accent, color: "#fff" }}>New</span>
              )}
            </div>
            <span className="font-bold text-lg leading-tight" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{l.name}</span>
          </div>
        </div>

        {/* Release date */}
        <div className="flex items-center gap-1.5 text-xs mb-3 px-2 py-1.5 rounded-lg"
          style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
          <Calendar size={11} />
          Release: <strong style={{ color: "var(--text-primary)" }}>{fmtRelease(l)}</strong>
        </div>

        {/* Bloodlines */}
        <div className="space-y-1 mb-3">
          {openBloodlines.slice(0, 3).map((b) => (
            <div key={b.name} className="flex items-center justify-between text-xs px-2 py-1 rounded"
              style={{ background: "var(--bg-raised)" }}>
              <span style={{ color: "var(--text-primary)" }}>{b.name}</span>
              <span className="font-semibold" style={{ color: "var(--success)" }}>Open</span>
            </div>
          ))}
          {openBloodlines.length > 3 && (
            <p className="text-xs px-2" style={{ color: "var(--text-faint)" }}>+{openBloodlines.length - 3} more open</p>
          )}
          {closedCount > 0 && (
            <p className="text-xs px-2" style={{ color: "var(--text-faint)" }}>{closedCount} full</p>
          )}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-1 text-xs font-bold uppercase tracking-wide transition-all duration-300 group-hover:gap-2"
          style={{ color: accent }}>
          Reserve Now <ArrowRight size={12} />
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
