"use client";

import { Play } from "lucide-react";

interface VideoCardProps {
  title: string;
  description?: string;
  thumbnail?: string;
  duration?: number;
  categories: { slug: string; label: string }[];
  onClick: () => void;
}

function fmtDuration(s?: number) {
  if (!s) return "";
  const m = Math.floor(s / 60);
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

export default function VideoCard({ title, description, thumbnail, duration, categories, onClick }: VideoCardProps) {
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
      {/* Info — fixed height so all cards align */}
      <div className="px-3 py-2.5" style={{ minHeight: 72 }}>
        <p className="line-clamp-2 leading-snug tracking-wide uppercase mb-1"
          style={{ fontFamily: "var(--font-heading)", fontSize: "0.95rem", fontWeight: 600, color: "var(--text-primary)" }}>
          {title || "Untitled"}
        </p>
        {description && (
          <p className="line-clamp-2 text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
    </div>
  );
}
