"use client";

import { useEffect, useState } from "react";
import PhotoCard from "@/components/media/PhotoCard";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Media { _id: string; title: string; url: string; categories: { slug: string; label: string }[]; createdAt: string }
interface Category { slug: string; label: string }

function Lightbox({ photos, idx, onClose, onPrev, onNext }: {
  photos: Media[]; idx: number; onClose: () => void; onPrev: () => void; onNext: () => void
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowLeft") onPrev();
      if (e.key === "ArrowRight") onNext();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose, onPrev, onNext]);

  const photo = photos[idx];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.92)" }} onClick={onClose}>
      <button className="absolute top-4 right-4 p-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }} onClick={onClose}><X size={20} /></button>
      {idx > 0 && <button className="absolute left-4 p-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); onPrev(); }}><ChevronLeft size={24} /></button>}
      {idx < photos.length - 1 && <button className="absolute right-4 p-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); onNext(); }}><ChevronRight size={24} /></button>}
      <img src={photo.url} alt={photo.title} className="max-w-[90vw] max-h-[90vh] rounded-xl object-contain" onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

export default function PhotosPage() {
  const [photos, setPhotos] = useState<Media[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/media?page=photos&limit=200").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([m, c]) => { setPhotos(m.data ?? []); setCategories(c.data ?? []); setLoading(false); });
  }, []);

  function toggleCat(slug: string) {
    setActiveCats((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  }

  const filtered = activeCats.length ? photos.filter((p) => p.categories.some((c) => activeCats.includes(c.slug))) : photos;

  const col1 = filtered.filter((_, i) => i % 3 === 0);
  const col2 = filtered.filter((_, i) => i % 3 === 1);
  const col3 = filtered.filter((_, i) => i % 3 === 2);

  return (
    <div className="min-h-screen px-4 md:px-16 py-8 max-w-[1280px] mx-auto">
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-6" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Photos</h1>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setActiveCats([])} className="px-3 py-1 rounded-full text-sm transition-all"
            style={{ background: activeCats.length === 0 ? "var(--accent)" : "var(--bg-raised)", color: activeCats.length === 0 ? "#fff" : "var(--text-muted)", border: `1px solid ${activeCats.length === 0 ? "var(--accent)" : "var(--border)"}` }}>All</button>
          {categories.map((c) => (
            <button key={c.slug} onClick={() => toggleCat(c.slug)} className="px-3 py-1 rounded-full text-sm transition-all"
              style={{ background: activeCats.includes(c.slug) ? "var(--accent)" : "var(--bg-raised)", color: activeCats.includes(c.slug) ? "#fff" : "var(--text-muted)", border: `1px solid ${activeCats.includes(c.slug) ? "var(--accent)" : "var(--border)"}` }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {Array.from({ length: 9 }).map((_, i) => <div key={i} className="rounded-[12px] h-48 animate-pulse" style={{ background: "var(--bg-surface)" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24" style={{ color: "var(--text-faint)" }}>No photos yet</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[col1, col2, col3].map((col, ci) => (
            <div key={ci} className="flex flex-col gap-3">
              {col.map((p) => {
                const realIdx = filtered.indexOf(p);
                return <PhotoCard key={p._id} url={p.url} title={p.title} onClick={() => setLightboxIdx(realIdx)} />;
              })}
            </div>
          ))}
        </div>
      )}

      {lightboxIdx !== null && (
        <Lightbox photos={filtered} idx={lightboxIdx} onClose={() => setLightboxIdx(null)}
          onPrev={() => setLightboxIdx((i) => Math.max(0, (i ?? 0) - 1))}
          onNext={() => setLightboxIdx((i) => Math.min(filtered.length - 1, (i ?? 0) + 1))} />
      )}
    </div>
  );
}
