"use client";

import { useEffect, useState } from "react";
import VideoCard from "@/components/media/VideoCard";
import VideoPlayer from "@/components/media/VideoPlayer";

interface Media {
  _id: string; title: string; url: string; thumbnail?: string;
  duration?: number; categories: { slug: string; label: string }[]; createdAt: string;
}
interface Category { slug: string; label: string }

export default function VideosPage() {
  const [videos, setVideos] = useState<Media[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCats, setActiveCats] = useState<string[]>([]);
  const [playing, setPlaying] = useState<Media | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/media?page=videos&limit=100").then((r) => r.json()),
      fetch("/api/categories").then((r) => r.json()),
    ]).then(([m, c]) => {
      setVideos(m.data ?? []);
      setCategories(c.data ?? []);
      setLoading(false);
    });
  }, []);

  function toggleCat(slug: string) {
    setActiveCats((prev) => prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]);
  }

  const filtered = activeCats.length
    ? videos.filter((v) => v.categories.some((c) => activeCats.includes(c.slug)))
    : videos;

  return (
    <div className="min-h-screen px-4 md:px-16 py-8 max-w-[1280px] mx-auto">
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-6" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Fight Videos</h1>

      {/* Category chips */}
      {categories.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-8">
          <button onClick={() => setActiveCats([])}
            className="px-3 py-1 rounded-full text-sm transition-all"
            style={{ background: activeCats.length === 0 ? "var(--accent)" : "var(--bg-raised)", color: activeCats.length === 0 ? "#fff" : "var(--text-muted)", border: `1px solid ${activeCats.length === 0 ? "var(--accent)" : "var(--border)"}` }}>
            All
          </button>
          {categories.map((c) => (
            <button key={c.slug} onClick={() => toggleCat(c.slug)}
              className="px-3 py-1 rounded-full text-sm transition-all"
              style={{ background: activeCats.includes(c.slug) ? "var(--accent)" : "var(--bg-raised)", color: activeCats.includes(c.slug) ? "#fff" : "var(--text-muted)", border: `1px solid ${activeCats.includes(c.slug) ? "var(--accent)" : "var(--border)"}` }}>
              {c.label}
            </button>
          ))}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="rounded-[12px] aspect-video animate-pulse" style={{ background: "var(--bg-surface)" }} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-24" style={{ color: "var(--text-faint)" }}>No videos yet</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((v) => (
            <VideoCard key={v._id} title={v.title} thumbnail={v.thumbnail} duration={v.duration}
              categories={v.categories} createdAt={v.createdAt} onClick={() => setPlaying(v)} />
          ))}
        </div>
      )}

      {playing && <VideoPlayer url={playing.url} title={playing.title} onClose={() => setPlaying(null)} />}
    </div>
  );
}
