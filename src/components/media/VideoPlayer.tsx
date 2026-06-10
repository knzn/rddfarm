"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface VideoPlayerProps {
  url: string;
  title?: string;
  onClose: () => void;
}

export default function VideoPlayer({ url, title, onClose }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.85)" }} onClick={onClose}>
      <div className="w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-3">
          {title && <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{title}</p>}
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg" style={{ color: "var(--text-muted)" }}><X size={20} /></button>
        </div>
        <video
          ref={videoRef}
          src={url}
          controls
          autoPlay
          className="w-full rounded-[12px] max-h-[70vh]"
          style={{ background: "#000" }}
        />
      </div>
    </div>
  );
}
