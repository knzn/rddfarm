"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Play, Bird, Camera, ArrowRight, Calendar } from "lucide-react";

interface Listing {
  _id: string; name: string; slug: string; type: string;
  releaseDate: string; bloodlines: { name: string; closed: boolean }[];
  createdAt: string;
}

const SECTION_CARDS = [
  { href: "/videos", label: "Fight Videos", desc: "Watch our roosters in action", icon: Play, color: "var(--accent)" },
  { href: "/breeding", label: "Breeding Materials", desc: "Photos and videos of our breeding stock", icon: Bird, color: "var(--success)" },
  { href: "/photos", label: "Photos", desc: "Our gamefarm gallery", icon: Camera, color: "var(--warning)" },
];

const TYPE_LABELS: Record<string, string> = {
  pahulugan: "Pahulugan",
  "months-old": "Months Old",
  "day-old": "Day Old",
};

function ListingCard({ l }: { l: Listing }) {
  const isNew = (Date.now() - new Date(l.createdAt).getTime()) < 7 * 24 * 60 * 60 * 1000;
  const openCount = l.bloodlines.filter((b) => !b.closed).length;
  const href = `/${l.type}/${l.slug}`;

  return (
    <Link href={href} className="shrink-0 w-64 rounded-[12px] border overflow-hidden transition-all hover:-translate-y-1 hover:border-[var(--accent)]"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)", boxShadow: "none" }}>
      <div className="h-28 flex items-center justify-center" style={{ background: "var(--bg-raised)" }}>
        <Bird size={40} style={{ color: "var(--text-faint)" }} />
      </div>
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>{l.name}</span>
          {isNew && <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: "var(--accent)", color: "#fff" }}>New</span>}
        </div>
        <div className="flex items-center gap-1 text-xs mb-2" style={{ color: "var(--text-muted)" }}>
          <Calendar size={11} />{new Date(l.releaseDate).toLocaleDateString()}
        </div>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>{openCount} bloodline{openCount !== 1 ? "s" : ""} available</p>
      </div>
    </Link>
  );
}

function ReservationSection({ type, listings }: { type: string; listings: Listing[] }) {
  if (!listings.length) return null;
  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4 px-4 md:px-16">
        <h3 className="font-semibold text-lg" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{TYPE_LABELS[type]}</h3>
        <Link href={`/${type}/${listings[0]?.slug}`} className="flex items-center gap-1 text-sm" style={{ color: "var(--accent)" }}>
          View All <ArrowRight size={14} />
        </Link>
      </div>
      <div className="flex gap-4 overflow-x-auto px-4 md:px-16 pb-2 scrollbar-none">
        {listings.map((l) => <ListingCard key={l._id} l={l} />)}
      </div>
    </div>
  );
}

export default function LandingClient() {
  const [listings, setListings] = useState<Listing[]>([]);

  useEffect(() => {
    fetch("/api/listings?active=true")
      .then((r) => r.json())
      .then((j) => setListings(j.data ?? []));
  }, []);

  const byType = (type: string) => listings.filter((l) => l.type === type);

  return (
    <div style={{ background: "var(--bg-base)" }}>
      {/* Section cards */}
      <section className="px-4 md:px-16 py-16 max-w-[1280px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SECTION_CARDS.map(({ href, label, desc, icon: Icon, color }) => (
            <Link key={href} href={href}
              className="rounded-[12px] p-6 border transition-all hover:-translate-y-1 group"
              style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                style={{ background: `${color}20` }}>
                <Icon size={22} style={{ color }} />
              </div>
              <h3 className="font-bold text-base mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{label}</h3>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>{desc}</p>
              <div className="flex items-center gap-1 mt-4 text-xs font-medium" style={{ color }}>
                View <ArrowRight size={12} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Reservation listings */}
      {listings.length > 0 && (
        <section id="reservations" className="pb-16">
          <div className="px-4 md:px-16 mb-8">
            <h2 className="text-2xl font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
              Available Orders
            </h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Select a listing to reserve</p>
          </div>
          {["pahulugan", "months-old", "day-old"].map((type) => (
            <ReservationSection key={type} type={type} listings={byType(type)} />
          ))}
        </section>
      )}
    </div>
  );
}
