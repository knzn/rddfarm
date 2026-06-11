"use client";

import { useEffect, useRef, useState } from "react";
import { Pencil, Trash2, Check, X, Play, Image as ImageIcon, Search } from "lucide-react";

interface Category { _id: string; slug: string; label: string }

interface MediaItem {
  _id: string;
  type: "video" | "photo";
  page: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  categories: Category[];
}

const PAGE_OPTIONS = ["all", "videos", "breeding", "photos"] as const;

export default function MediaManagerClient() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [allCategories, setAllCategories] = useState<Category[]>([]);
  const [editPage, setEditPage] = useState("");
  const editPageRef = useRef("");
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState<typeof PAGE_OPTIONS[number]>("all");
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editCats, setEditCats] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  async function loadCategories(itemPage: string) {
    const res = await fetch(`/api/categories?page=${itemPage}`);
    const j = await res.json();
    setAllCategories(j.data ?? []);
  }

  useEffect(() => {
    fetchMedia();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  async function fetchMedia() {
    setLoading(true);
    const q = page === "all" ? "" : `&page=${page}`;
    const res = await fetch(`/api/media?limit=100${q}`);
    const j = await res.json();
    setItems(j.data ?? []);
    setLoading(false);
  }

  function startEdit(item: MediaItem) {
    setEditingId(item._id);
    setEditTitle(item.title ?? "");
    setEditDesc(item.description ?? "");
    setEditCats(item.categories?.map((c) => c._id) ?? []);
    setEditPage(item.page);
    editPageRef.current = item.page; // sync ref so addNewCategory always has current page
    setNewCat("");
    setAllCategories([]);
    loadCategories(item.page);
  }

  async function addNewCategory() {
    if (!newCat.trim()) return;
    const page = editPageRef.current; // always current, never stale
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newCat.trim(), page }),
    });
    const j = await res.json();
    if (j.data) {
      setEditCats((prev) => prev.includes(j.data._id) ? prev : [...prev, j.data._id]);
      await loadCategories(page);
    }
    setNewCat("");
  }

  async function deleteCategory(catId: string) {
    await fetch(`/api/categories/${catId}`, { method: "DELETE" });
    setAllCategories((prev) => prev.filter((c) => c._id !== catId));
    setEditCats((prev) => prev.filter((id) => id !== catId));
    // Remove from all items in local state too
    setItems((prev) => prev.map((i) => ({
      ...i,
      categories: i.categories?.filter((c) => c._id !== catId) ?? [],
    })));
  }

  function toggleCat(id: string) {
    setEditCats((prev) => prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]);
  }

  async function saveEdit(id: string) {
    setSaving(true);
    await fetch(`/api/media/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, description: editDesc, categories: editCats }),
    });
    const updatedCats = allCategories.filter((c) => editCats.includes(c._id));
    setItems((prev) => prev.map((i) => i._id === id ? { ...i, title: editTitle, description: editDesc, categories: updatedCats } : i));
    setEditingId(null);
    setSaving(false);
  }

  async function deleteItem(id: string) {
    setDeletingId(id);
    await fetch(`/api/media/${id}`, { method: "DELETE" });
    setItems((prev) => prev.filter((i) => i._id !== id));
    setDeletingId(null);
    setConfirmDelete(null);
  }

  const filtered = items.filter((i) =>
    !search || i.title?.toLowerCase().includes(search.toLowerCase())
  );

  const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";
  const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div>
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-1"
        style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
        Manage Media
      </h1>
      <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
        Edit titles, descriptions, or delete media. Deleting also removes the file from storage.
      </p>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        {/* Page filter */}
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-raised)" }}>
          {PAGE_OPTIONS.map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className="px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all"
              style={{
                background: page === p ? "var(--accent)" : "transparent",
                color: page === p ? "#fff" : "var(--text-muted)",
              }}>
              {p === "all" ? "All" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 flex-1 min-w-[200px] rounded-lg px-3"
          style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
          <Search size={14} style={{ color: "var(--text-faint)" }} />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title..."
            className="flex-1 bg-transparent text-sm outline-none py-2"
            style={{ color: "var(--text-primary)" }} />
        </div>
      </div>

      {/* Count */}
      <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>{filtered.length} item{filtered.length !== 1 ? "s" : ""}</p>

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-video rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>No media found.</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((item) => {
            const thumb = item.thumbnail ?? (item.type === "photo" ? item.url : null);
            const isEditing = editingId === item._id;
            const isDeleting = deletingId === item._id;
            const isConfirming = confirmDelete === item._id;

            return (
              <div key={item._id} className="rounded-[12px] overflow-hidden"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                {/* Thumbnail */}
                <div className="aspect-video relative overflow-hidden flex items-center justify-center"
                  style={{ background: "var(--bg-raised)" }}>
                  {thumb ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={thumb} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <Play size={28} style={{ color: "var(--text-faint)" }} />
                  )}
                  {/* Type badge */}
                  <div className="absolute top-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                    style={{ background: "rgba(8,11,20,0.8)", color: "var(--text-muted)" }}>
                    {item.type === "video" ? <Play size={9} /> : <ImageIcon size={9} />}
                    {item.page}
                  </div>
                </div>

                {/* Body */}
                <div className="p-3 space-y-2">
                  {isEditing ? (
                    <>
                      <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                        className={inputCls} style={inputStyle} placeholder="Title" />
                      <textarea value={editDesc} onChange={(e) => setEditDesc(e.target.value)}
                        rows={2} className={`${inputCls} resize-none`} style={inputStyle} placeholder="Description (optional)" />
                      <div>
                          <p className="text-xs mb-1.5" style={{ color: "var(--text-faint)" }}>Categories</p>
                          <div className="flex flex-wrap gap-1.5">
                            {allCategories.map((c) => {
                              const active = editCats.includes(c._id);
                              return (
                                <div key={c._id} className="flex items-center rounded-full overflow-hidden"
                                  style={{
                                    background: active ? "var(--accent)" : "var(--bg-raised)",
                                    border: `1px solid ${active ? "var(--accent)" : "var(--border)"}`,
                                  }}>
                                  <button type="button" onClick={() => toggleCat(c._id)}
                                    className="px-2 py-0.5 text-xs transition-all"
                                    style={{ color: active ? "#fff" : "var(--text-muted)" }}>
                                    {c.label}
                                  </button>
                                  <button type="button" onClick={() => deleteCategory(c._id)}
                                    className="pr-1.5 pl-0.5 py-0.5 text-xs transition-all hover:opacity-70"
                                    style={{ color: active ? "rgba(255,255,255,0.7)" : "var(--danger)" }}
                                    title="Delete category">
                                    <X size={10} />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                          <div className="flex gap-1.5 mt-2">
                            <input value={newCat} onChange={(e) => setNewCat(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addNewCategory())}
                              placeholder="New category..."
                              className="flex-1 rounded-lg px-2 py-1 text-xs outline-none"
                              style={{ background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
                            <button type="button" onClick={addNewCategory}
                              className="px-2 py-1 rounded-lg text-xs font-medium"
                              style={{ background: "var(--bg-raised)", color: "var(--accent)", border: "1px solid var(--border)" }}>
                              Add
                            </button>
                          </div>
                        </div>
                      <div className="flex gap-2">
                        <button onClick={() => saveEdit(item._id)} disabled={saving}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
                          style={{ background: "var(--success)", color: "#fff" }}>
                          <Check size={13} /> Save
                        </button>
                        <button onClick={() => setEditingId(null)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium"
                          style={{ background: "var(--bg-raised)", color: "var(--text-muted)" }}>
                          <X size={13} /> Cancel
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {item.title || <span style={{ color: "var(--text-faint)" }}>Untitled</span>}
                      </p>
                      {item.description && (
                        <p className="text-xs line-clamp-2" style={{ color: "var(--text-muted)" }}>{item.description}</p>
                      )}
                      {item.categories?.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {item.categories.map((c) => (
                            <span key={c._id} className="text-[10px] px-1.5 py-0.5 rounded-full"
                              style={{ background: "var(--bg-raised)", color: "var(--text-faint)", border: "1px solid var(--border)" }}>
                              {c.label}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex gap-2 pt-1">
                        <button onClick={() => startEdit(item)}
                          className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium transition-all hover:opacity-80"
                          style={{ background: "var(--bg-raised)", color: "var(--accent)", border: "1px solid var(--border)" }}>
                          <Pencil size={12} /> Edit
                        </button>
                        {isConfirming ? (
                          <button onClick={() => deleteItem(item._id)} disabled={isDeleting}
                            className="flex-1 flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                            style={{ background: "var(--danger)", color: "#fff" }}>
                            {isDeleting ? "Deleting..." : "Confirm"}
                          </button>
                        ) : (
                          <button onClick={() => setConfirmDelete(item._id)}
                            className="flex items-center justify-center px-3 py-1.5 rounded-lg text-xs transition-all hover:opacity-80"
                            style={{ background: "var(--bg-raised)", color: "var(--danger)", border: "1px solid var(--border)" }}>
                            <Trash2 size={12} />
                          </button>
                        )}
                      </div>
                      {isConfirming && (
                        <p className="text-xs text-center" style={{ color: "var(--danger)" }}>
                          This deletes the file from storage too. Are you sure?{" "}
                          <button onClick={() => setConfirmDelete(null)} className="underline" style={{ color: "var(--text-muted)" }}>Cancel</button>
                        </p>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
