"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronDown, MessageCircle } from "lucide-react";

interface Media { url: string; thumbnail?: string; cropPosition?: string }

export default function Hero() {
  const [photos, setPhotos] = useState<Media[]>([]);
  const [idx, setIdx] = useState(0);
  const [messengerUrl, setMessengerUrl] = useState("");

  useEffect(() => {
    fetch("/api/media?page=photos&featured=true&limit=8")
      .then((r) => r.json())
      .then(async (j) => {
        if ((j.data ?? []).length > 0) {
          setPhotos(j.data);
        } else {
          const fb = await fetch("/api/media?page=photos&limit=8").then((r) => r.json());
          setPhotos(fb.data ?? []);
        }
      });

    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => { if (j.data?.messengerUrl) setMessengerUrl(j.data.messengerUrl); });
  }, []);

  useEffect(() => {
    if (photos.length <= 1) return;
    const t = setInterval(() => setIdx((i) => (i + 1) % photos.length), 5000);
    return () => clearInterval(t);
  }, [photos]);

  const bg = photos[idx]?.url ?? photos[idx]?.thumbnail;

  return (
    <section className="relative h-[50vh] min-h-[320px] overflow-hidden flex items-center">
      {/* Slideshow background — natural size, anchored right, no stretch */}
      <div className="absolute inset-0" style={{ background: "var(--bg-base)" }}>
        {bg && (() => {
          const pos = photos[idx]?.cropPosition ?? "50% 50%";
          const [x, y] = pos.match(/\d+/g)?.map(Number) ?? [50, 50];
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={bg} alt="" className="absolute transition-opacity duration-1000"
              style={{
              position: "absolute",
              width: "100%",
              height: "auto",
              top: `${30 + y * 0.4}%`,
              left: `${30 + x * 0.4}%`,
              transform: "translate(-50%, -50%)",
            }} />
          );
        })()}
      </div>

      {/* Left overlay for text */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(to right, rgba(8,11,20,0.75) 0%, rgba(8,11,20,0.5) 50%, transparent 80%)" }} />
      {/* Top fade */}
      <div className="absolute inset-x-0 top-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(to bottom, #080B14, transparent)" }} />
      {/* Bottom fade */}
      <div className="absolute inset-x-0 bottom-0 h-24 pointer-events-none"
        style={{ background: "linear-gradient(to top, #080B14, transparent)" }} />

      {/* Content */}
      <div className="relative z-10 px-8 md:px-16 max-w-2xl">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] mb-3" style={{ color: "var(--accent)" }}>
          Roberto D. Dacles
        </p>
        <h1 className="text-6xl md:text-8xl font-bold uppercase leading-none mb-1"
          style={{ fontFamily: "var(--font-heading)", color: "#fff" }}>
          RDD
        </h1>
        <h1 className="text-6xl md:text-8xl font-bold uppercase leading-none mb-1"
          style={{ fontFamily: "var(--font-heading)", color: "var(--accent)" }}>
          GAMEFARM
        </h1>
        <div className="h-1 w-20 rounded-full mb-4 mt-2" style={{ background: "var(--accent)" }} />
        <p className="text-base mb-5 max-w-sm" style={{ color: "var(--text-muted)" }}>
          📍 Bugho, San Fernando, Cebu
        </p>
        <div className="flex gap-3 flex-wrap">
          {messengerUrl ? (
            <a href={messengerUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-90"
              style={{ background: "var(--accent)", color: "#fff" }}>
              <MessageCircle size={15} /> Messenger
            </a>
          ) : (
            <Link href="/photos"
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-medium text-sm transition-all hover:opacity-90"
              style={{ background: "var(--accent)", color: "#fff" }}>
              View Our Birds
            </Link>
          )}
          <button
            onClick={() => document.getElementById("reservations")?.scrollIntoView({ behavior: "smooth" })}
            className="px-5 py-2 rounded-lg font-medium text-sm transition-all"
            style={{ border: "1px solid var(--border)", color: "var(--text-primary)" }}>
            Make a Reservation
          </button>
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
              className="rounded-full transition-all"
              style={{ background: i === idx ? "var(--accent)" : "var(--text-faint)", width: i === idx ? 20 : 6, height: 6 }} />
          ))}
        </div>
      )}
    </section>
  );
}
