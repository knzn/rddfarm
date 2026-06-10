"use client";

interface PhotoCardProps {
  url: string;
  title?: string;
  onClick: () => void;
}

export default function PhotoCard({ url, title, onClick }: PhotoCardProps) {
  return (
    <div onClick={onClick} className="relative overflow-hidden rounded-[12px] cursor-pointer group border"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <img src={url} alt={title ?? ""} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
      {title && (
        <div className="absolute inset-0 flex items-end opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent)" }}>
          <p className="px-3 pb-3 text-sm font-medium" style={{ color: "#fff" }}>{title}</p>
        </div>
      )}
    </div>
  );
}
