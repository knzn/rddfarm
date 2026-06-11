"use client";

import { useEffect, useState } from "react";
import VideoCard from "@/components/media/VideoCard";
import PhotoCard from "@/components/media/PhotoCard";
import VideoPlayer from "@/components/media/VideoPlayer";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

interface Media { _id: string; title: string; url: string; thumbnail?: string; type: "video" | "photo"; categories: { slug: string; label: string }[]; duration?: number; createdAt: string }
interface Category { slug: string; label: string }

export default function BreedingPage() {
  const [items, setItems] = useState<Media[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [playingVideo, setPlayingVideo] = useState<Media | null>(null);
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/media?page=breeding&limit=200").then((r) => r.json()),
      fetch("/api/categories?page=breeding").then((r) => r.json()),
    ]).then(([m, c]) => { setItems(m.data ?? []); setCategories(c.data ?? []); setLoading(false); });
  }, []);

  function toggleCat(slug: string) {
    setActiveCats((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  }

  const filtered = activeCats.length ? items.filter((v) => v.categories.some((c) => activeCats.includes(c.slug))) : items;
  const photos = filtered.filter((i) => i.type === "photo");

  return (
    <div className="min-h-screen px-4 md:px-16 py-8 max-w-[1280px] mx-auto">
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-6" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Breeding Materials</h1>

      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setActiveCats([])} className="px-3 py-1 rounded-full text-sm"
            style={{ background: activeCats.length === 0 ? "var(--accent)" : "var(--bg-raised)", color: activeCats.length === 0 ? "#fff" : "var(--text-muted)", border: `1px solid ${activeCats.length === 0 ? "var(--accent)" : "var(--border)"}` }}>All</button>
          {categories.map((c) => (
            <button key={c.slug} onClick={() => toggleCat(c.slug)} className="px-3 py-1 rounded-full text-sm"
              style={{ background: activeCats.includes(c.slug) ? "var(--accent)" : "var(--bg-raised)", color: activeCats.includes(c.slug) ? "#fff" : "var(--text-muted)", border: `1px solid ${activeCats.includes(c.slug) ? "var(--accent)" : "var(--border)"}` }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="rounded-[12px] h-40 animate-pulse" style={{ background: "var(--bg-surface)" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24" style={{ color: "var(--text-faint)" }}>No content yet</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) =>
            item.type === "video"
              ? <VideoCard key={item._id} title={item.title} thumbnail={item.thumbnail} duration={item.duration} categories={item.categories} onClick={() => setPlayingVideo(item)} />
              : <PhotoCard key={item._id} url={item.url} title={item.title} onClick={() => setLightboxIdx(photos.indexOf(item))} />
          )}
        </div>
      )}

      {playingVideo && <VideoPlayer url={playingVideo.url} title={playingVideo.title} onClose={() => setPlayingVideo(null)} />}

      {lightboxIdx !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.92)" }} onClick={() => setLightboxIdx(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}><X size={20} /></button>
          {lightboxIdx > 0 && <button className="absolute left-4 p-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => Math.max(0, (i ?? 0) - 1)); }}><ChevronLeft size={24} /></button>}
          {lightboxIdx < photos.length - 1 && <button className="absolute right-4 p-2 rounded-full" style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }} onClick={(e) => { e.stopPropagation(); setLightboxIdx((i) => Math.min(photos.length - 1, (i ?? 0) + 1)); }}><ChevronRight size={24} /></button>}
          <img src={photos[lightboxIdx]?.url} alt="" className="max-w-[90vw] max-h-[90vh] rounded-xl" onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </div>
  );
}
