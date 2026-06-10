"use client";

import { useEffect, useRef, useState } from "react";
import { Star, Check } from "lucide-react";

interface Photo {
  _id: string;
  title: string;
  url: string;
  featured: boolean;
  cropPosition: string;
}

export default function JumbotronClient() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/media?page=photos&limit=50")
      .then((r) => r.json())
      .then((j) => { setPhotos(j.data ?? []); setLoading(false); });
  }, []);

  async function toggleFeatured(photo: Photo) {
    setToggling(photo._id);
    const res = await fetch(`/api/media/${photo._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ featured: !photo.featured }),
    });
    if (res.ok) {
      setPhotos((prev) => prev.map((p) => p._id === photo._id ? { ...p, featured: !p.featured } : p));
    }
    setToggling(null);
  }

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [savedId, setSavedId] = useState<string | null>(null);

  function setCropPosition(photo: Photo, cropPosition: string) {
    // Update preview instantly
    setPhotos((prev) => prev.map((p) => p._id === photo._id ? { ...p, cropPosition } : p));
    // Debounce save — only fires 600ms after user stops dragging
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      const res = await fetch(`/api/media/${photo._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cropPosition }),
      });
      if (res.ok) {
        setSavedId(photo._id);
        setTimeout(() => setSavedId(null), 2000);
      }
    }, 600);
  }

  const featured = photos.filter((p) => p.featured);
  const rest = photos.filter((p) => !p.featured);

  return (
    <div>
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-1"
        style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
        Jumbotron Photos
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        Star photos to show them in the homepage slideshow. If none are starred, all photos are shown.
      </p>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />
          ))}
        </div>
      ) : photos.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>No photos uploaded yet. Upload photos first.</div>
      ) : (
        <>
          {featured.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xs font-semibold uppercase tracking-wide mb-3 flex items-center gap-1.5"
                style={{ color: "var(--warning)" }}>
                <Star size={13} fill="currentColor" /> Featured ({featured.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {featured.map((p) => <PhotoCard key={p._id} photo={p} toggling={toggling} savedId={savedId} onToggle={toggleFeatured} onCrop={setCropPosition} />)}
              </div>
            </div>
          )}

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-faint)" }}>
              All Photos ({rest.length})
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {rest.map((p) => <PhotoCard key={p._id} photo={p} toggling={toggling} savedId={savedId} onToggle={toggleFeatured} onCrop={setCropPosition} />)}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function PhotoCard({ photo, toggling, savedId, onToggle, onCrop }: {
  photo: Photo;
  toggling: string | null;
  savedId: string | null;
  onToggle: (p: Photo) => void;
  onCrop: (p: Photo, pos: string) => void;
}) {
  const [x, y] = (() => {
    const nums = (photo.cropPosition ?? "50% 50%").match(/\d+/g)?.map(Number);
    return nums?.length === 2 ? nums : [50, 50];
  })();

  return (
    <div className="rounded-[12px] overflow-hidden" style={{ border: `1px solid ${photo.featured ? "var(--warning)" : "var(--border)"}` }}>
      <div className="aspect-video relative overflow-hidden" style={{ background: "var(--bg-raised)" }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo.url} alt={photo.title}
          className="absolute transition-all"
          style={{
            position: "absolute",
            width: "100%",
            height: "auto",
            top: `${30 + y * 0.4}%`,
            left: `${30 + x * 0.4}%`,
            transform: "translate(-50%, -50%)",
          }} />
      </div>
      <div className="p-2 space-y-1.5" style={{ background: "var(--bg-surface)" }}>
        <div className="flex items-center justify-between gap-1">
          <span className="text-xs truncate" style={{ color: "var(--text-muted)" }}>{photo.title}</span>
          <button onClick={() => onToggle(photo)} disabled={toggling === photo._id}
            className="shrink-0 p-1 rounded-lg transition-all disabled:opacity-40"
            style={{ color: photo.featured ? "var(--warning)" : "var(--text-faint)" }}
            title={photo.featured ? "Remove from jumbotron" : "Add to jumbotron"}>
            <Star size={16} fill={photo.featured ? "currentColor" : "none"} />
          </button>
        </div>
        {photo.featured && (
          <div className="space-y-2">
            {/* Top / Bottom slider */}
            <div className="space-y-0.5">
              <div className="flex justify-between text-xs" style={{ color: "var(--text-faint)" }}>
                <span>Top ↕ Bottom</span>
                <span className="flex items-center gap-1">
                  {savedId === photo._id
                    ? <span className="flex items-center gap-0.5" style={{ color: "var(--success)" }}><Check size={11} /> Saved</span>
                    : <span style={{ color: "var(--accent)" }}>{y}%</span>}
                </span>
              </div>
              <input type="range" min={0} max={100} step={5} value={y}
                onChange={(e) => onCrop(photo, `${x}% ${e.target.value}%`)}
                className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                style={{ accentColor: "var(--accent)" }} />
              <div className="flex justify-between text-xs" style={{ color: "var(--text-faint)" }}>
                <span>Top</span><span>Bottom</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
