"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, X, CheckCircle, AlertCircle } from "lucide-react";

const PAGE_OPTIONS = ["videos", "breeding", "photos"] as const;

interface Category { _id: string; slug: string; label: string }

export default function UploadClient() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [thumb, setThumb] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [page, setPage] = useState<typeof PAGE_OPTIONS[number]>("videos");
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((j) => setCategories(j.data ?? []));
  }, []);

  function toggleCat(slug: string) {
    setSelectedCats((prev) =>
      prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]
    );
  }

  async function addCategory() {
    if (!newCat.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newCat.trim() }),
    });
    const j = await res.json();
    if (j.data) {
      setCategories((prev) => [...prev, j.data]);
      setSelectedCats((prev) => [...prev, j.data.slug]);
    }
    setNewCat("");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setStatus("uploading");
    setProgress(0);
    setErrorMsg("");

    try {
      // 1. Get presigned URL
      const presignRes = await fetch("/api/media/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, contentType: file.type }),
      });
      const { presignedUrl, finalCdnUrl } = await presignRes.json();

      // 2. Upload to DO Spaces via XHR for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.upload.onprogress = (e) => {
          if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 90));
        };
        xhr.onload = () => (xhr.status < 300 ? resolve() : reject(new Error("Upload failed")));
        xhr.onerror = () => reject(new Error("Network error"));
        xhr.open("PUT", presignedUrl);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.setRequestHeader("x-amz-acl", "public-read");
        xhr.send(file);
      });

      // 3. Upload thumbnail if provided
      let thumbnailUrl = "";
      if (thumb) {
        const tPresign = await fetch("/api/media/presign", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ filename: `thumb_${thumb.name}`, contentType: thumb.type }),
        });
        const { presignedUrl: tUrl, finalCdnUrl: tCdn } = await tPresign.json();
        await fetch(tUrl, { method: "PUT", body: thumb, headers: { "Content-Type": thumb.type, "x-amz-acl": "public-read" } });
        thumbnailUrl = tCdn;
      }

      setProgress(95);

      // 4. Save media record
      const mediaType = file.type.startsWith("video") ? "video" : "photo";
      await fetch("/api/media", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: mediaType,
          page,
          title,
          description,
          url: finalCdnUrl,
          thumbnail: thumbnailUrl || undefined,
          categories: selectedCats,
        }),
      });

      setProgress(100);
      setStatus("done");
      setFile(null); setThumb(null); setTitle(""); setDescription(""); setSelectedCats([]);
      if (fileRef.current) fileRef.current.value = "";
      if (thumbRef.current) thumbRef.current.value = "";
    } catch (err) {
      setStatus("error");
      setErrorMsg((err as Error).message);
    }
  }

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none transition-all";
  const inputStyle = {
    background: "var(--bg-raised)",
    border: "1px solid var(--border)",
    color: "var(--text-primary)",
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-6"
        style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
        Upload Media
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* File picker */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
            File <span style={{ color: "var(--danger)" }}>*</span>
          </label>
          <input ref={fileRef} type="file" accept="video/mp4,image/*"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            className={inputCls} style={inputStyle} required />
          {file && <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{file.name} ({(file.size / 1024 / 1024).toFixed(1)} MB)</p>}
        </div>

        {/* Thumbnail (video only) */}
        {file?.type.startsWith("video") && (
          <div>
            <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
              Thumbnail (optional)
            </label>
            <input ref={thumbRef} type="file" accept="image/*"
              onChange={(e) => setThumb(e.target.files?.[0] ?? null)}
              className={inputCls} style={inputStyle} />
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)}
            className={inputCls} style={inputStyle} placeholder="e.g. EB2026 Stag vs Sweater" />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Description</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)}
            rows={3} className={`${inputCls} resize-none`} style={inputStyle}
            placeholder="Optional description..." />
        </div>

        {/* Page target */}
        <div>
          <label className="block text-sm font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Page</label>
          <select value={page} onChange={(e) => setPage(e.target.value as typeof PAGE_OPTIONS[number])}
            className={inputCls} style={inputStyle}>
            {PAGE_OPTIONS.map((p) => <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
          </select>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: "var(--text-muted)" }}>Categories</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {categories.map((c) => (
              <button type="button" key={c.slug} onClick={() => toggleCat(c.slug)}
                className="px-3 py-1 rounded-full text-xs transition-all"
                style={{
                  background: selectedCats.includes(c.slug) ? "var(--accent)" : "var(--bg-raised)",
                  color: selectedCats.includes(c.slug) ? "#fff" : "var(--text-muted)",
                  border: `1px solid ${selectedCats.includes(c.slug) ? "var(--accent)" : "var(--border)"}`,
                }}>
                {c.label}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
              placeholder="Add new category..." onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
              className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
              style={{ ...inputStyle, height: 36 }} />
            <button type="button" onClick={addCategory}
              className="px-3 py-2 rounded-lg text-sm transition-all"
              style={{ background: "var(--bg-raised)", color: "var(--accent)", border: "1px solid var(--border)" }}>
              Add
            </button>
          </div>
        </div>

        {/* Progress */}
        {status === "uploading" && (
          <div>
            <div className="flex justify-between text-xs mb-1" style={{ color: "var(--text-muted)" }}>
              <span>Uploading...</span><span>{progress}%</span>
            </div>
            <div className="h-2 rounded-full overflow-hidden" style={{ background: "var(--bg-raised)" }}>
              <div className="h-full rounded-full transition-all duration-300"
                style={{ width: `${progress}%`, background: "var(--accent)" }} />
            </div>
          </div>
        )}

        {status === "done" && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--success)" }}>
            <CheckCircle size={16} /> Upload complete
          </div>
        )}

        {status === "error" && (
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--danger)" }}>
            <AlertCircle size={16} /> {errorMsg}
          </div>
        )}

        <button type="submit" disabled={status === "uploading" || !file}
          className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm transition-all disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}>
          <Upload size={16} />
          {status === "uploading" ? "Uploading..." : "Upload"}
        </button>
      </form>
    </div>
  );
}
