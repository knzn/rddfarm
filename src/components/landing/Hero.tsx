"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

interface Media { url: string; thumbnail?: string }

export default function Hero() {
  const [photos, setPhotos] = useState<Media[]>([]);
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    fetch("/api/media?page=photos&limit=8")
      .then((r) => r.json())
      .then((j) => setPhotos(j.data ?? []));
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % photos.length), 5000);
    return () => clearInterval(t);
  }, [photos]);

  const bg = photos[idx]?.url ?? photos[idx]?.thumbnail;

  return (
    <section className="relative h-screen overflow-hidden flex items-center">
      {/* Slideshow background */}
      <div className="absolute inset-0 transition-opacity duration-1000"
        style={{
          background: bg
            ? `url(${bg}) center/cover no-repeat`
            : "var(--bg-raised)",
        }} />

      {/* Dark overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, #080B14 45%, rgba(8,11,20,0.6) 70%, transparent)" }} />

      {/* Content */}
      <div className="relative z-10 px-8 md:px-16 max-w-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] mb-3" style={{ color: "var(--accent)" }}>
          Official Gamefarm
        </p>
        <h1 className="text-6xl md:text-8xl font-bold uppercase leading-none mb-2"
          style={{ fontFamily: "var(--font-heading)", color: "#fff" }}>
          RDD
        </h1>
        <h1 className="text-6xl md:text-8xl font-bold uppercase leading-none mb-1"
          style={{ fontFamily: "var(--font-heading)", color: "var(--accent)" }}>
          GAMEFARM
        </h1>
        {/* Animated accent bar */}
        <div className="h-1 w-24 rounded-full mb-6 mt-4" style={{ background: "var(--accent)" }} />
        <p className="text-base md:text-lg mb-8 max-w-md" style={{ color: "var(--text-muted)" }}>
          Premium breeding stock, fight videos, and reservation system for serious breeders.
        </p>
        <div className="flex gap-3 flex-wrap">
          <Link href="/photos" className="px-6 py-3 rounded-lg font-medium text-sm transition-all hover:opacity-90"
            style={{ background: "var(--accent)", color: "#fff" }}>
            View Our Birds
          </Link>
          <Link href="/#reservations" className="px-6 py-3 rounded-lg font-medium text-sm transition-all"
            style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            Make a Reservation
          </Link>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce" style={{ color: "var(--text-faint)" }}>
        <ChevronDown size={24} />
      </div>

      {/* Slide dots */}
      {photos.length > 1 && (
        <div className="absolute bottom-8 right-8 flex gap-1.5">
          {photos.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)}
              className="w-1.5 h-1.5 rounded-full transition-all"
              style={{ background: i === idx ? "var(--accent)" : "var(--text-faint)", width: i === idx ? 20 : 6 }} />
          ))}
        </div>
      )}
    </section>
  );
}
