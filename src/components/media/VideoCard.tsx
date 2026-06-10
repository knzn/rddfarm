"use client";

import { Play } from "lucide-react";

interface VideoCardProps {
  title: string;
  thumbnail?: string;
  duration?: number;
  categories: string[];
  createdAt: string;
  onClick: () => void;
}

function fmtDuration(s?: number) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

export default function VideoCard({ title, thumbnail, duration, categories, createdAt, onClick }: VideoCardProps) {
  return (
    <div onClick={onClick} className="rounded-[12px] overflow-hidden border cursor-pointer transition-all hover:-translate-y-1 group"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden" style={{ background: "var(--bg-raised)" }}>
        {thumbnail
          ? <img src={thumbnail} alt={title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          : <div className="absolute inset-0 flex items-center justify-center"><Play size={40} style={{ color: "var(--text-faint)" }} /></div>
        }
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ background: "var(--accent)" }}>
            <Play size={20} fill="white" style={{ color: "#fff" }} />
          </div>
        </div>
        {duration && (
          <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-xs font-mono font-medium"
            style={{ background: "rgba(0,0,0,0.75)", color: "#fff" }}>
            {fmtDuration(duration)}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="p-3">
        <p className="text-sm font-medium line-clamp-2 leading-snug mb-2" style={{ color: "var(--text-primary)" }}>{title || "Untitled"}</p>
        <div className="flex flex-wrap gap-1 mb-1.5">
          {categories.slice(0, 3).map((c) => (
            <span key={c} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-raised)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{c}</span>
          ))}
        </div>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>{new Date(createdAt).toLocaleDateString()}</p>
      </div>
    </div>
  );
}
