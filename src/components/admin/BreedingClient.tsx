"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Trash2, Copy, Check, RefreshCw, ImagePlus, X, ZoomIn } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Season {
  _id: string; name: string; year: number; markingsGenerated: boolean;
  generatedAt?: string; eggsLaid?: number; chicksHatched?: number; hatchRate?: number;
  expectedHatchDate?: string; maleCount?: number; femaleCount?: number; sexCountDone: boolean;
}
interface Hen { henName: string; marking?: string; group?: string; penEggsLaid?: number; penChicksHatched?: number }
interface Mating {
  _id: string; maleName: string; malePhoto?: string; noseGroup?: string;
  sameMarking?: boolean; mandatoryMarking?: string; eggMarking?: string;
  photos?: string[];
  hens: Hen[];
  seasonId: string;
}
interface MarkingAssignment { matingId: string; maleName: string; noseGroup: string; hens: { henName: string; marking: string }[] }

const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";

// ── Lightbox ───────────────────────────────────────────────────────────────────
function Lightbox({ src, onClose }: { src: string; onClose: () => void }) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.92)" }}
      onClick={onClose}>
      <button className="absolute top-4 right-4 p-2 rounded-full"
        style={{ background: "rgba(255,255,255,0.1)", color: "#fff" }}>
        <X size={20} />
      </button>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="Full size"
        className="max-w-full max-h-full rounded-xl object-contain"
        style={{ maxHeight: "90vh", maxWidth: "90vw" }}
        onClick={(e) => e.stopPropagation()} />
    </div>
  );
}

// ── Photo uploader grid ────────────────────────────────────────────────────────
function PhotoGrid({ photos, onAdd, onRemove }: {
  photos: string[];
  onAdd: (url: string) => void;
  onRemove: (idx: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setUploading(true);
    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "portfolio/breeding");
      const res = await fetch("/api/media/upload", { method: "POST", body: fd });
      if (res.ok) {
        const data = await res.json();
        if (data.url) onAdd(data.url);
      }
    }
    setUploading(false);
  }

  return (
    <>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      <div className="flex flex-wrap gap-2">
        {photos.map((url, i) => (
          <div key={i} className="relative group rounded-lg overflow-hidden cursor-pointer"
            style={{ width: 80, height: 80 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" onClick={() => setLightbox(url)} />
            <div className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.55)" }}>
              <button type="button" onClick={() => setLightbox(url)}
                className="p-1 rounded" style={{ color: "#fff" }}><ZoomIn size={14} /></button>
              <button type="button" onClick={() => onRemove(i)}
                className="p-1 rounded" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        <button type="button" disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed text-xs gap-1 disabled:opacity-50"
          style={{ width: 80, height: 80, borderColor: "var(--border)", color: "var(--text-faint)" }}>
          <ImagePlus size={18} />
          {uploading ? "…" : "Add"}
        </button>
        <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
      </div>
    </>
  );
}

// ── Mating photo strip (card view) ────────────────────────────────────────────
function MatingPhotoStrip({ photos }: { photos: string[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  return (
    <>
      {lightbox && <Lightbox src={lightbox} onClose={() => setLightbox(null)} />}
      <div className="mt-3 flex gap-1.5 flex-wrap">
        {photos.map((url, i) => (
          <button key={i} type="button" onClick={() => setLightbox(url)}
            className="relative rounded-lg overflow-hidden group"
            style={{ width: 64, height: 64, flexShrink: 0 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
              style={{ background: "rgba(0,0,0,0.5)" }}>
              <ZoomIn size={16} color="#fff" />
            </div>
          </button>
        ))}
      </div>
    </>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SeasonsTab({ onSelect }: { onSelect: (s: Season) => void }) {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", year: String(new Date().getFullYear()) });
  const [showForm, setShowForm] = useState(false);

  async function load() {
    setLoading(true);
    const r = await fetch("/api/seasons");
    const j = await r.json();
    setSeasons(j.data ?? []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/seasons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name, year: +form.year }) });
    setShowForm(false); setForm({ name: "", year: String(new Date().getFullYear()) }); load();
  }

  async function duplicate(id: string) {
    await fetch(`/api/seasons/${id}/duplicate`, { method: "POST" }); load();
  }

  async function deleteSeason(id: string) {
    if (!confirm("Delete season?")) return;
    await fetch(`/api/seasons/${id}`, { method: "DELETE" }); load();
  }

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}><Plus size={15} /> New Season</button>
      </div>
      {showForm && (
        <div className="rounded-[12px] p-5 mb-4 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <form onSubmit={create} className="flex gap-3">
            <input placeholder="Season name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`flex-1 ${inputCls}`} style={inputStyle} />
            <input type="number" placeholder="Year" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} className="rounded-lg px-3 py-2 text-sm outline-none" style={{ ...inputStyle, width: 90 }} />
            <button type="button" onClick={() => setShowForm(false)} className="px-3 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
            <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Create</button>
          </form>
        </div>
      )}
      {loading ? <div className="space-y-2">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-16 rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />)}</div>
        : seasons.length === 0 ? <div className="text-center py-12" style={{ color: "var(--text-faint)" }}>No seasons yet</div>
        : (
          <div className="space-y-2">
            {seasons.map((s) => (
              <div key={s._id} className="flex items-center justify-between px-5 py-4 rounded-[12px] border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div>
                  <span className="font-semibold cursor-pointer hover:underline" style={{ color: "var(--text-primary)" }} onClick={() => onSelect(s)}>{s.name} {s.year}</span>
                  <div className="flex gap-2 mt-1">
                    {s.markingsGenerated && <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--success)20", color: "var(--success)" }}>Markings done</span>}
                    {s.hatchRate != null && <span className="text-xs" style={{ color: "var(--text-muted)" }}>{s.hatchRate.toFixed(1)}% hatch rate</span>}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => duplicate(s._id)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--text-muted)" }} title="Duplicate"><Copy size={14} /></button>
                  <button onClick={() => deleteSeason(s._id)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

type MatingType = "single" | "flock" | null;
type MarkingMode = "same" | "diff" | null;

interface MatingFormState {
  maleName: string;
  mandatoryMarking: string;
  eggMarking: string;
  photos: string[];
  hens: { henName: string; group?: string }[];
  matingType: MatingType;
  markingMode: MarkingMode;
}

const BLANK_FORM: MatingFormState = {
  maleName: "", mandatoryMarking: "", eggMarking: "", photos: [],
  hens: [{ henName: "", group: "" }],
  matingType: null, markingMode: null,
};

function TypeCard({ label, desc, icon, active, onClick }: {
  label: string; desc: string; icon: string; active: boolean; onClick: () => void;
}) {
  return (
    <button type="button" onClick={onClick}
      className="flex-1 rounded-[12px] p-4 text-left transition-all"
      style={{
        background: active ? "var(--accent)15" : "var(--bg-raised)",
        border: `2px solid ${active ? "var(--accent)" : "var(--border)"}`,
      }}>
      <div className="text-2xl mb-2">{icon}</div>
      <p className="font-bold text-sm uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)", color: active ? "var(--accent)" : "var(--text-primary)" }}>{label}</p>
      <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>{desc}</p>
    </button>
  );
}

function MatingForm({
  initial, onSave, onCancel,
}: {
  initial?: MatingFormState;
  onSave: (payload: object) => Promise<void>;
  onCancel: () => void;
}) {
  const [form, setForm] = useState<MatingFormState>(initial ?? BLANK_FORM);
  const [saving, setSaving] = useState(false);

  const validHens = form.hens.filter((h) => h.henName.trim());
  const multiHen = form.hens.length > 1;
  // marking mode required when multiple hens (both mating types)
  const needsMarkingMode = !!form.matingType && multiHen;

  function selectType(t: MatingType) {
    // Flock mating defaults to same marking — user can still change it
    setForm({ ...form, matingType: t, markingMode: t === "flock" ? "same" : null });
  }

  function updateHen(i: number, patch: Partial<{ henName: string; group: string }>) {
    setForm({ ...form, hens: form.hens.map((h, j) => j === i ? { ...h, ...patch } : h) });
  }

  function addHen() {
    setForm({ ...form, hens: [...form.hens, { henName: "", group: "" }] });
  }

  function removeHen(i: number) {
    setForm({ ...form, hens: form.hens.filter((_, j) => j !== i) });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.matingType) return;
    setSaving(true);
    const sameMarking = !multiHen ? null
      : form.markingMode === "diff" ? false
      : true; // default to same marking if not explicitly set to diff
    await onSave({
      maleName: form.maleName,
      henNames: validHens.map((h) => h.henName.trim()),
      henGroups: validHens.map((h) => h.group?.trim() || null),
      sameMarking,
      mandatoryMarking: form.mandatoryMarking.trim() || null,
      eggMarking: form.eggMarking.trim() || null,
      photos: form.photos,
    });
    setSaving(false);
  }

  return (
    <form onSubmit={submit} className="space-y-5">

      {/* Stag name */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-faint)" }}>Stag / Cock Name</label>
        <input placeholder="e.g. Raptor Sweater" required value={form.maleName}
          onChange={(e) => setForm({ ...form, maleName: e.target.value })}
          className={inputCls} style={inputStyle} />
      </div>

      {/* Step 1 — mating type */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-faint)" }}>Mating Type</label>
        <div className="flex gap-3">
          <TypeCard label="Single/Battery Mating" desc="1 stag · single pen or battery cage" icon="🐓" active={form.matingType === "single"} onClick={() => selectType("single")} />
          <TypeCard label="Flock Mating" desc="1 stag · multiple hens" icon="🐓🐔🐔🐔" active={form.matingType === "flock"} onClick={() => selectType("flock")} />
        </div>
      </div>

      {/* Hens — shown once mating type picked */}
      {form.matingType && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-faint)" }}>Hens / Pullets</label>
          <div className="space-y-2">
            {form.hens.map((h, i) => (
              <div key={i} className="flex gap-2 items-center">
                <input placeholder={`Hen ${i + 1} name`} value={h.henName}
                  onChange={(e) => updateHen(i, { henName: e.target.value })}
                  className={`flex-1 ${inputCls}`} style={inputStyle} />
                {/* Group tag — only in diff marking mode with multiple hens */}
                {form.markingMode === "diff" && multiHen && (
                  <div className="flex items-center gap-1" title="Group letter — hens with same letter share a marking">
                    <span className="text-[10px] uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Grp</span>
                    <input
                      maxLength={2}
                      placeholder="—"
                      value={h.group ?? ""}
                      onChange={(e) => updateHen(i, { group: e.target.value.toUpperCase() })}
                      className="rounded-lg px-2 py-2 text-sm text-center font-mono font-bold outline-none uppercase"
                      style={{ ...inputStyle, width: 44 }}
                    />
                  </div>
                )}
                {form.hens.length > 1 && (
                  <button type="button" onClick={() => removeHen(i)}
                    className="p-1.5" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
                )}
              </div>
            ))}
            <button type="button" onClick={addHen}
              className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--accent)" }}>
              + Add Hen
            </button>
          </div>
        </div>
      )}

      {/* Step 2 — marking mode (shown when multiple hens, both mating types) */}
      {needsMarkingMode && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-faint)" }}>Marking Mode</label>
          <div className="flex gap-3">
            <TypeCard label="Same Marking" desc="All hens share one marking combo" icon="🔁" active={form.markingMode === "same"} onClick={() => setForm({ ...form, markingMode: "same" })} />
            <TypeCard label="Diff Marking" desc="Unique combos — group sisters with Grp tag" icon="🎯" active={form.markingMode === "diff"} onClick={() => setForm({ ...form, markingMode: "diff" })} />
          </div>
          {form.markingMode === "diff" && (
            <p className="text-xs mt-2 px-1" style={{ color: "var(--text-faint)" }}>
              Sisters that share a marking? Type the same letter (e.g. <strong>A</strong>) in their <strong>Grp</strong> field.
            </p>
          )}
        </div>
      )}

      {/* Mandatory marking */}
      {form.matingType && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-faint)" }}>Mandatory Marking <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label>
          <input placeholder="e.g. LN-RI" value={form.mandatoryMarking}
            onChange={(e) => setForm({ ...form, mandatoryMarking: e.target.value })}
            className={inputCls} style={inputStyle} />
        </div>
      )}

      {/* Egg marking */}
      {form.matingType && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-1.5 block" style={{ color: "var(--text-faint)" }}>Egg Marking <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label>
          <input placeholder="e.g. X, Circle, Blue dot" value={form.eggMarking}
            onChange={(e) => setForm({ ...form, eggMarking: e.target.value })}
            className={inputCls} style={inputStyle} />
        </div>
      )}

      {/* Reference photos */}
      {form.matingType && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-faint)" }}>Reference Photos <span style={{ color: "var(--text-faint)", fontWeight: 400 }}>(optional)</span></label>
          <PhotoGrid
            photos={form.photos}
            onAdd={(url) => setForm({ ...form, photos: [...form.photos, url] })}
            onRemove={(idx) => setForm({ ...form, photos: form.photos.filter((_, i) => i !== idx) })}
          />
        </div>
      )}

      <div className="flex gap-2 justify-end pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
        <button type="submit" disabled={saving || !form.matingType}
          className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
          style={{ background: "var(--accent)", color: "#fff" }}>
          {saving ? "Saving…" : "Save Mating"}
        </button>
      </div>
    </form>
  );
}

function MatingsTab({ season }: { season: Season | null }) {
  const [matings, setMatings] = useState<Mating[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function load() {
    if (!season) return;
    const r = await fetch(`/api/seasons/${season._id}/matings`);
    const j = await r.json();
    setMatings(j.data ?? []);
  }
  useEffect(() => { load(); }, [season]);

  async function create(payload: object) {
    if (!season) return;
    await fetch(`/api/seasons/${season._id}/matings`, {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    setShowAdd(false); load();
  }

  async function update(matingId: string, payload: object) {
    if (!season) return;
    // PATCH accepts hens[] directly — convert henNames back to hens array
    const p = payload as { henNames?: string[]; henGroups?: (string | null)[]; [k: string]: unknown };
    const patched = { ...p };
    if (p.henNames) {
      patched.hens = p.henNames.map((n: string, idx: number) => ({
        henName: n,
        group: p.henGroups?.[idx] || null,
      }));
      delete patched.henNames;
      delete patched.henGroups;
    }
    await fetch(`/api/seasons/${season._id}/matings/${matingId}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(patched),
    });
    setEditingId(null); load();
  }

  async function deleteMating(id: string) {
    if (!season || !confirm("Delete this mating?")) return;
    await fetch(`/api/seasons/${season._id}/matings/${id}`, { method: "DELETE" }); load();
  }

  if (!season) return <div className="text-center py-12" style={{ color: "var(--text-faint)" }}>Select a season from the Seasons tab first</div>;

  return (
    <div>
      <p className="text-sm font-medium mb-4" style={{ color: "var(--text-muted)" }}>Season: {season.name} {season.year}</p>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setShowAdd(true); setEditingId(null); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "#fff" }}>
          <Plus size={15} /> Add Mating
        </button>
      </div>

      {showAdd && (
        <div className="rounded-[12px] p-5 mb-4 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>New Mating</p>
          <MatingForm onSave={create} onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {matings.length === 0 ? (
        <div className="text-center py-12" style={{ color: "var(--text-faint)" }}>No matings yet</div>
      ) : (
        <div className="flex flex-wrap gap-4">
          {matings.map((m) => {
            const hasMarkings = m.hens.some((h) => h.marking);
            const color = hasMarkings ? "var(--success)" : "var(--accent)";
            return (
            <div key={m._id} className="rounded-[12px] overflow-hidden flex flex-col w-full md:w-[300px]"
              style={{
                background: "var(--bg-surface)",
                border: `1px solid ${editingId === m._id ? color : "var(--border)"}`,
                borderTop: `3px solid ${color}`,
              }}>

              {editingId === m._id ? (
                <div className="p-5 flex-1">
                  <p className="text-sm font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Edit Mating</p>
                  <MatingForm
                    initial={{
                      maleName: m.maleName,
                      mandatoryMarking: m.mandatoryMarking ?? "",
                      eggMarking: m.eggMarking ?? "",
                      photos: m.photos ?? [],
                      hens: m.hens.length > 0 ? m.hens.map((h) => ({ henName: h.henName, group: h.group ?? "" })) : [{ henName: "", group: "" }],
                      matingType: m.hens.length === 1 && m.sameMarking == null ? "single" : "flock",
                      markingMode: m.sameMarking === true ? "same" : m.sameMarking === false ? "diff" : null,
                    }}
                    onSave={(p) => update(m._id, p)}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="p-5 flex flex-col flex-1">

                  {/* Row 1 — label + actions */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: "var(--accent)" }}>
                      🐓 Stag
                    </span>
                    <div className="flex gap-1.5">
                      <button onClick={() => { setEditingId(m._id); setShowAdd(false); }}
                        className="px-2.5 py-1 rounded-lg text-xs"
                        style={{ border: "1px solid var(--border)", color: "var(--accent)" }}>
                        Edit
                      </button>
                      <button onClick={() => deleteMating(m._id)}
                        className="p-1.5 rounded-lg hover:opacity-70"
                        style={{ color: "var(--danger)" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Row 2 — stag name */}
                  <p className="text-2xl font-bold leading-tight mb-4"
                    style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                    {m.maleName}
                  </p>

                  {/* Row 3 — hen count box */}
                  <div className="flex items-center gap-2 rounded-lg px-3 py-2 mb-4"
                    style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>Hens:</span>
                    <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {m.hens.length} {m.hens.length === 1 ? "hen" : "hens"}
                    </span>
                    {m.sameMarking != null && (
                      <>
                        <span style={{ color: "var(--border)" }}>·</span>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {m.sameMarking ? "Same marking" : "Unique markings"}
                        </span>
                      </>
                    )}
                  </div>

                  {/* Row 4 — hens list */}
                  <div className="space-y-1.5 flex-1">
                    {m.sameMarking === true ? (
                      <div className="flex items-center justify-between rounded-lg px-3 py-2"
                        style={{ background: "var(--bg-raised)" }}>
                        <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{m.hens.length} hens</span>
                        {m.hens[0]?.marking
                          ? <span className="text-xs font-mono font-bold" style={{ color }}>{m.hens[0].marking}</span>
                          : <span className="text-xs" style={{ color: "var(--text-faint)" }}>—</span>
                        }
                      </div>
                    ) : (
                      m.hens.map((h, i) => (
                        <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2"
                          style={{ background: "var(--bg-raised)" }}>
                          <div className="flex items-center gap-1.5">
                            {h.group && (
                              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded"
                                style={{ background: "var(--accent)20", color: "var(--accent)" }}>
                                {h.group}
                              </span>
                            )}
                            <span className="text-sm" style={{ color: "var(--text-primary)" }}>{h.henName}</span>
                          </div>
                          {h.marking
                            ? <span className="text-xs font-mono font-bold" style={{ color }}>{h.marking}</span>
                            : <span className="text-xs" style={{ color: "var(--text-faint)" }}>—</span>
                          }
                        </div>
                      ))
                    )}
                  </div>

                  {/* Row 5 — mandatory marking (if set) */}
                  {m.mandatoryMarking && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ background: "var(--warning)15", border: "1px solid var(--warning)40" }}>
                      <span className="text-xs" style={{ color: "var(--warning)" }}>Mandatory:</span>
                      <span className="text-xs font-mono font-bold" style={{ color: "var(--warning)" }}>{m.mandatoryMarking}</span>
                    </div>
                  )}

                  {/* Row 6 — egg marking (if set) */}
                  {m.eggMarking && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2"
                      style={{ background: "var(--accent)10", border: "1px solid var(--accent)30" }}>
                      <span className="text-xs" style={{ color: "var(--accent)" }}>🥚 Egg Mark:</span>
                      <span className="text-xs font-mono font-bold" style={{ color: "var(--accent)" }}>{m.eggMarking}</span>
                    </div>
                  )}

                  {/* Row 7 — reference photos (if any) */}
                  {m.photos && m.photos.length > 0 && (
                    <MatingPhotoStrip photos={m.photos} />
                  )}

                </div>
              )}
            </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── MarkingTable — spreadsheet-style view + CSV download ──────────────────────
interface MarkingTableProps {
  preview: MarkingAssignment[];
  season: Season | null;
  confirmed: boolean;
  swapState: { matingId: string; henName: string } | null;
  newMarking: string;
  swapError: string;
  setNewMarking: (v: string) => void;
  setSwapState: (v: { matingId: string; henName: string } | null) => void;
  setSwapError: (v: string) => void;
  doSwap: () => void;
}

function MarkingTable({ preview, season, confirmed, swapState, newMarking, swapError, setNewMarking, setSwapState, setSwapError, doSwap }: MarkingTableProps) {
  const [dbMatings, setDbMatings] = useState<Mating[]>([]);
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!season) return;
    fetch(`/api/seasons/${season._id}/matings`)
      .then((r) => r.json())
      .then((j) => setDbMatings(j.data ?? []));
  }, [season?._id]);

  function downloadCSV() {
    if (!season) return;
    const headers = ["#", "Stag/Cock", "Hen/Pullet", "Nose Group", "Marking", "Reserve", "Egg Mark", "Mandatory"];
    const rows: string[][] = [];
    let rowNum = 1;
    for (const a of preview) {
      const db = dbMatings.find((m) => m._id === a.matingId);
      const reserve = (a as MarkingAssignment & { reserveCombo?: string }).reserveCombo ?? "";
      const eggMark = db?.eggMarking ?? "";
      const mandatory = db?.mandatoryMarking ?? "";
      for (const h of a.hens) {
        rows.push([String(rowNum++), a.maleName, h.henName, a.noseGroup, h.marking, reserve, eggMark, mandatory]);
      }
    }
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\r\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `markings-${season.name}-${season.year}.csv`.replace(/\s+/g, "-");
    a.click();
    URL.revokeObjectURL(url);
  }

  async function takePhoto() {
    if (!tableRef.current || !season) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(tableRef.current, {
      backgroundColor: "#0f0f0f",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `markings-${season.name}-${season.year}.png`.replace(/\s+/g, "-");
    a.click();
  }

  // Build flat rows for the table
  type TableRow = {
    rowNum: number;
    matingId: string;
    maleName: string;
    henName: string;
    noseGroup: string;
    marking: string;
    reserve: string;
    eggMark: string;
    mandatory: string;
    isFirstHen: boolean;
    henCount: number;
  };

  const tableRows: TableRow[] = [];
  let rowNum = 1;
  for (const a of preview) {
    const db = dbMatings.find((m) => m._id === a.matingId);
    const reserve = (a as MarkingAssignment & { reserveCombo?: string }).reserveCombo ?? "";
    const eggMark = db?.eggMarking ?? "";
    const mandatory = db?.mandatoryMarking ?? "";
    a.hens.forEach((h, i) => {
      tableRows.push({
        rowNum: rowNum++,
        matingId: a.matingId,
        maleName: a.maleName,
        henName: h.henName,
        noseGroup: a.noseGroup,
        marking: h.marking,
        reserve,
        eggMark,
        mandatory,
        isFirstHen: i === 0,
        henCount: a.hens.length,
      });
    });
  }

  const cellStyle: React.CSSProperties = { padding: "8px 12px", borderBottom: "1px solid var(--border)", color: "var(--text-primary)", fontSize: 13 };
  const headStyle: React.CSSProperties = { padding: "8px 12px", fontSize: 11, fontWeight: 600, textTransform: "uppercase" as const, letterSpacing: "0.05em", color: "var(--text-faint)", borderBottom: "2px solid var(--border)", background: "var(--bg-raised)" };

  return (
    <div>
      {/* Action buttons */}
      <div className="flex justify-end gap-2 mb-3">
        <button onClick={downloadCSV}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--bg-raised)" }}>
          ⬇ Download CSV
        </button>
        <button onClick={takePhoto}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ border: "1px solid var(--border)", color: "var(--text-muted)", background: "var(--bg-raised)" }}>
          📷 Save as Photo
        </button>
      </div>

      <div ref={tableRef} className="rounded-[12px] border overflow-hidden" style={{ borderColor: "var(--border)" }}>
        <table className="w-full" style={{ borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={headStyle}>#</th>
              <th style={headStyle}>Stag / Cock</th>
              <th style={headStyle}>Hen / Pullet</th>
              <th style={headStyle}>Group</th>
              <th style={headStyle}>Marking</th>
              <th style={headStyle}>Reserve</th>
              <th style={headStyle}>Egg Mark</th>
              <th style={headStyle}>Mandatory</th>
              {!confirmed && <th style={headStyle}></th>}
            </tr>
          </thead>
          <tbody>
            {tableRows.map((row) => (
              <tr key={`${row.matingId}-${row.henName}`} style={{ background: row.isFirstHen ? "var(--bg-surface)" : "var(--bg-base)" }}>
                <td style={{ ...cellStyle, color: "var(--text-faint)", width: 36 }}>{row.rowNum}</td>
                <td style={{ ...cellStyle, fontWeight: row.isFirstHen ? 600 : 400, color: row.isFirstHen ? "var(--text-primary)" : "var(--text-faint)" }}>
                  {row.isFirstHen ? row.maleName : ""}
                </td>
                <td style={cellStyle}>{row.henName}</td>
                <td style={{ ...cellStyle, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>{row.noseGroup}</td>
                <td style={cellStyle}>
                  <span className="font-mono font-semibold px-2 py-0.5 rounded"
                    style={{ background: "var(--accent)20", color: "var(--accent)", fontSize: 12 }}>
                    {row.marking}
                  </span>
                </td>
                <td style={cellStyle}>
                  {row.isFirstHen && row.reserve ? (
                    <span className="font-mono px-2 py-0.5 rounded text-xs"
                      style={{ background: "var(--warning)20", color: "var(--warning)", border: "1px solid var(--warning)40" }}>
                      {row.reserve}
                    </span>
                  ) : null}
                </td>
                <td style={{ ...cellStyle, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                  {row.isFirstHen ? row.eggMark : ""}
                </td>
                <td style={{ ...cellStyle, fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--text-muted)" }}>
                  {row.isFirstHen ? row.mandatory : ""}
                </td>
                {!confirmed && (
                  <td style={{ ...cellStyle, textAlign: "right", whiteSpace: "nowrap" }}>
                    {swapState?.matingId === row.matingId && swapState?.henName === row.henName ? (
                      <div className="flex gap-2 justify-end items-center">
                        <input value={newMarking} onChange={(e) => setNewMarking(e.target.value)} placeholder="New combo"
                          className="rounded-lg px-2 py-1 text-xs outline-none"
                          style={{ border: "1px solid var(--border)", background: "var(--bg-raised)", color: "var(--text-primary)", width: 110 }} />
                        <button onClick={doSwap} className="text-xs px-2 py-1 rounded" style={{ background: "var(--accent)", color: "#fff" }}>Apply</button>
                        <button onClick={() => { setSwapState(null); setSwapError(""); }} className="text-xs px-2 py-1 rounded"
                          style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>✕</button>
                      </div>
                    ) : (
                      <button onClick={() => { setSwapState({ matingId: row.matingId, henName: row.henName }); setNewMarking(""); setSwapError(""); }}
                        className="text-xs px-2 py-1 rounded" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Swap</button>
                    )}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {swapError && <p className="text-sm mt-2" style={{ color: "var(--danger)" }}>{swapError}</p>}
    </div>
  );
}

// A stag match found in another season
interface StagMatch {
  matingId: string;   // current season's matingId
  maleName: string;
  prevSeasonName: string;
  prevYear: number;
  prevMarking: string; // the marking the first hen got last time (representative)
  decision: "reuse" | "skip" | null;
}

function GenerateTab({ season }: { season: Season | null }) {
  const [preview, setPreview] = useState<MarkingAssignment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [swapState, setSwapState] = useState<{ matingId: string; henName: string } | null>(null);
  const [newMarking, setNewMarking] = useState("");
  const [swapError, setSwapError] = useState("");

  // Pre-generate confirmation state
  const [matches, setMatches] = useState<StagMatch[] | null>(null); // null = not checked yet
  const [matchIdx, setMatchIdx] = useState(0); // which match we're currently reviewing

  // Load confirmed markings from DB on mount / season change
  useEffect(() => {
    if (!season || preview) return;
    if (!season.markingsGenerated) return;
    fetch(`/api/seasons/${season._id}/matings`)
      .then((r) => r.json())
      .then((j) => {
        const matings: Mating[] = j.data ?? [];
        const hasMarkings = matings.some((m) => m.hens.some((h) => h.marking));
        if (!hasMarkings) return;
        const loaded = matings.map((m) => ({
          matingId: m._id,
          maleName: m.maleName,
          noseGroup: (m.noseGroup ?? "LN") as import("@/lib/marking-engine").NoseGroup,
          hens: m.hens.map((h) => ({ henName: h.henName, marking: h.marking ?? "" })),
        }));
        setPreview(loaded);
        setConfirmed(true);
      });
  }, [season?._id]);

  // Step 1: check for duplicate stag names in other seasons before generating
  async function startGenerate() {
    if (!season) return;
    setLoading(true);

    // fetch current season matings
    const curR = await fetch(`/api/seasons/${season._id}/matings`);
    const curJ = await curR.json();
    const curMatings: Mating[] = curJ.data ?? [];

    if (!curMatings.length) {
      setLoading(false);
      return;
    }

    // fetch all other seasons
    const allR = await fetch("/api/seasons");
    const allJ = await allR.json();
    const otherSeasons: Season[] = (allJ.data ?? []).filter((s: Season) => s._id !== season._id);

    const found: StagMatch[] = [];

    for (const other of otherSeasons) {
      const mR = await fetch(`/api/seasons/${other._id}/matings`);
      const mJ = await mR.json();
      const otherMatings: Mating[] = mJ.data ?? [];

      for (const cur of curMatings) {
        const match = otherMatings.find(
          (o) => o.maleName.trim().toLowerCase() === cur.maleName.trim().toLowerCase()
            && o.hens.some((h) => h.marking)
        );
        if (match) {
          // use the first hen's marking as the representative
          const rep = match.hens.find((h) => h.marking)?.marking ?? "";
          if (rep && !found.find((f) => f.matingId === cur._id)) {
            found.push({
              matingId: cur._id,
              maleName: cur.maleName,
              prevSeasonName: other.name,
              prevYear: other.year,
              prevMarking: rep,
              decision: null,
            });
          }
        }
      }
    }

    setLoading(false);

    if (found.length === 0) {
      // no matches — generate straight away
      await runGenerate([]);
    } else {
      setMatches(found);
      setMatchIdx(0);
    }
  }

  function decide(decision: "reuse" | "skip") {
    if (!matches) return;
    const updated = matches.map((m, i) => i === matchIdx ? { ...m, decision } : m);
    setMatches(updated);
    if (matchIdx + 1 < matches.length) {
      setMatchIdx(matchIdx + 1);
    } else {
      // all decided — build overrides and generate
      const overrides = updated
        .filter((m) => m.decision === "reuse")
        .map((m) => ({ matingId: m.matingId, marking: m.prevMarking }));
      runGenerate(overrides);
      setMatches(null);
    }
  }

  async function runGenerate(overrides: { matingId: string; marking: string }[]) {
    if (!season) return;
    setLoading(true); setPreview(null); setConfirmed(false);
    const r = await fetch(`/api/seasons/${season._id}/generate`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ overrides }),
    });
    const j = await r.json();
    if (j.error) { alert(j.error); }
    else setPreview(j.preview ?? null);
    setLoading(false);
  }

  async function doSwap() {
    if (!season || !swapState || !preview) return;
    setSwapError("");
    const r = await fetch(`/api/seasons/${season._id}/generate/swap`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPreview: preview, matingId: swapState.matingId, henName: swapState.henName, newMarking }),
    });
    const j = await r.json();
    if (j.error) { setSwapError(j.error); return; }
    setPreview(j.preview); setSwapState(null); setNewMarking("");
  }

  async function confirmMarkings() {
    if (!season || !preview) return;
    const r = await fetch(`/api/seasons/${season._id}/generate/confirm`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignments: preview }),
    });
    const j = await r.json();
    if (r.ok) setConfirmed(true);
    else alert("Confirm failed: " + (j.error ?? r.status));
  }

  async function reset() {
    if (!season || !window.confirm("Reset all markings?")) return;
    await fetch(`/api/seasons/${season._id}/generate`, { method: "DELETE" });
    setPreview(null); setConfirmed(false); setMatches(null);
  }

  if (!season) return <div className="text-center py-12" style={{ color: "var(--text-faint)" }}>Select a season first</div>;

  // ── Pre-generate confirmation modal ──────────────────────────────────────────
  if (matches && matchIdx < matches.length) {
    const m = matches[matchIdx];
    return (
      <div>
        <p className="text-sm font-medium mb-6" style={{ color: "var(--text-muted)" }}>
          Season: {season.name} {season.year}
        </p>
        <div className="max-w-md mx-auto">
          {/* Progress */}
          <p className="text-xs mb-3 text-center" style={{ color: "var(--text-faint)" }}>
            Stag match {matchIdx + 1} of {matches.length}
          </p>

          <div className="rounded-[12px] border p-6 text-center space-y-4"
            style={{ background: "var(--bg-surface)", borderColor: "var(--accent)" }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto text-2xl"
              style={{ background: "var(--accent)20" }}>
              🐓
            </div>
            <div>
              <p className="text-lg font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                {m.maleName}
              </p>
              <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                was used in <span style={{ color: "var(--text-primary)" }}>{m.prevSeasonName} {m.prevYear}</span>
              </p>
            </div>
            <div className="rounded-lg px-4 py-3" style={{ background: "var(--bg-raised)" }}>
              <p className="text-xs mb-1" style={{ color: "var(--text-faint)" }}>Previous marking</p>
              <p className="font-mono font-bold text-xl" style={{ color: "var(--accent)" }}>{m.prevMarking}</p>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Reuse this marking set for <strong style={{ color: "var(--text-primary)" }}>{m.maleName}</strong> in this season?
            </p>
            <div className="flex gap-3">
              <button onClick={() => decide("skip")}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>
                No, assign new
              </button>
              <button onClick={() => decide("reuse")}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium transition-all"
                style={{ background: "var(--accent)", color: "#fff" }}>
                Yes, reuse
              </button>
            </div>
          </div>

          {/* Skip all remaining */}
          {matches.length > 1 && (
            <button onClick={() => {
              const all = matches.map((x) => ({ ...x, decision: "skip" as const }));
              setMatches(all);
              runGenerate([]);
              setMatches(null);
            }} className="w-full mt-3 text-xs py-2" style={{ color: "var(--text-faint)" }}>
              Skip all — assign fresh markings to everyone
            </button>
          )}
        </div>
      </div>
    );
  }

  // ── Main generate view ────────────────────────────────────────────────────────
  return (
    <div>
      <p className="text-sm font-medium mb-4" style={{ color: "var(--text-muted)" }}>Season: {season.name} {season.year}</p>
      <div className="flex gap-3 mb-6 flex-wrap">
        <button onClick={startGenerate} disabled={loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          {loading ? "Checking…" : preview ? "Re-generate" : "Generate Preview"}
        </button>
        {preview && !confirmed && (
          <>
            <button onClick={confirmMarkings} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--success)", color: "#fff" }}>
              <Check size={14} /> Confirm & Save
            </button>
            <button onClick={reset} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--danger)", color: "var(--danger)" }}>Reset</button>
          </>
        )}
        {confirmed && <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--success)" }}><Check size={14} /> Markings confirmed!</span>}
      </div>

      {preview && (
        <MarkingTable
          preview={preview}
          season={season}
          confirmed={confirmed}
          swapState={swapState}
          newMarking={newMarking}
          swapError={swapError}
          setNewMarking={setNewMarking}
          setSwapState={setSwapState}
          setSwapError={setSwapError}
          doSwap={doSwap}
        />
      )}
    </div>
  );
}

function LifecycleTab({ season }: { season: Season | null }) {
  const [matings, setMatings] = useState<Mating[]>([]);
  const [mode, setMode] = useState<"pen" | "per-hen">("pen");
  const [penForms, setPenForms] = useState<Record<string, { penEggsLaid: string; penChicksHatched: string; penMaleCount: string; penFemaleCount: string }>>({});

  async function load() {
    if (!season) return;
    const r = await fetch(`/api/seasons/${season._id}/matings`);
    const j = await r.json();
    setMatings(j.data ?? []);
  }
  useEffect(() => { load(); }, [season]);

  async function savePen(matingId: string) {
    if (!season) return;
    const f = penForms[matingId];
    const payload: Record<string, number> = {};
    if (f.penEggsLaid) payload.penEggsLaid = +f.penEggsLaid;
    if (f.penChicksHatched) payload.penChicksHatched = +f.penChicksHatched;
    if (f.penMaleCount) payload.penMaleCount = +f.penMaleCount;
    if (f.penFemaleCount) payload.penFemaleCount = +f.penFemaleCount;
    await fetch(`/api/seasons/${season._id}/matings/${matingId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    load();
  }

  if (!season) return <div className="text-center py-12" style={{ color: "var(--text-faint)" }}>Select a season first</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Season: {season.name} {season.year}</p>
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: "var(--bg-surface)" }}>
          {(["pen", "per-hen"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className="px-3 py-1 rounded-md text-xs font-medium capitalize transition-all"
              style={{ background: mode === m ? "var(--accent)" : "transparent", color: mode === m ? "#fff" : "var(--text-muted)" }}>
              {m}
            </button>
          ))}
        </div>
      </div>

      {matings.length === 0 ? <div className="text-center py-12" style={{ color: "var(--text-faint)" }}>No matings yet</div>
        : (
          <div className="space-y-3">
            {matings.map((m) => {
              if (!penForms[m._id]) penForms[m._id] = { penEggsLaid: "", penChicksHatched: "", penMaleCount: "", penFemaleCount: "" };
              return (
                <div key={m._id} className="rounded-[12px] p-5 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                  <p className="font-semibold mb-3" style={{ color: "var(--text-primary)" }}>{m.maleName}</p>
                  {mode === "pen" ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Eggs Laid</label>
                        <input type="number" value={penForms[m._id]?.penEggsLaid ?? ""} onChange={(e) => setPenForms((p) => ({ ...p, [m._id]: { ...p[m._id], penEggsLaid: e.target.value } }))} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Chicks Hatched</label>
                        <input type="number" value={penForms[m._id]?.penChicksHatched ?? ""} onChange={(e) => setPenForms((p) => ({ ...p, [m._id]: { ...p[m._id], penChicksHatched: e.target.value } }))} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Male Count</label>
                        <input type="number" value={penForms[m._id]?.penMaleCount ?? ""} onChange={(e) => setPenForms((p) => ({ ...p, [m._id]: { ...p[m._id], penMaleCount: e.target.value } }))} className={inputCls} style={inputStyle} />
                      </div>
                      <div>
                        <label className="text-xs mb-1 block" style={{ color: "var(--text-muted)" }}>Female Count</label>
                        <input type="number" value={penForms[m._id]?.penFemaleCount ?? ""} onChange={(e) => setPenForms((p) => ({ ...p, [m._id]: { ...p[m._id], penFemaleCount: e.target.value } }))} className={inputCls} style={inputStyle} />
                      </div>
                      <div className="col-span-2 flex justify-end">
                        <button onClick={() => savePen(m._id)} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {m.hens.map((h, i) => (
                        <div key={i} className="flex items-center gap-3 text-sm">
                          <span className="w-32 truncate" style={{ color: "var(--text-muted)" }}>{h.henName}</span>
                          <input type="number" placeholder="Eggs" className="rounded-lg px-2 py-1.5 text-sm outline-none" style={{ ...inputStyle, width: 80 }} defaultValue={h.penEggsLaid ?? ""} />
                          <input type="number" placeholder="Chicks" className="rounded-lg px-2 py-1.5 text-sm outline-none" style={{ ...inputStyle, width: 80 }} defaultValue={h.penChicksHatched ?? ""} />
                        </div>
                      ))}
                      <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Per-hen mode — save coming soon</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
const TABS = ["Seasons", "Matings", "Generate", "Lifecycle"] as const;

export default function BreedingClient() {
  const [tab, setTab] = useState<typeof TABS[number]>("Seasons");
  const [selectedSeason, setSelectedSeason] = useState<Season | null>(null);

  function handleSelectSeason(s: Season) {
    setSelectedSeason(s);
    setTab("Matings");
  }

  return (
    <div>
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-6" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Breeding</h1>

      {selectedSeason && tab !== "Seasons" && (
        <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: "var(--text-muted)" }}>
          <button onClick={() => setSelectedSeason(null)} className="hover:underline" style={{ color: "var(--accent)" }}>All seasons</button>
          <span>/</span>
          <span style={{ color: "var(--text-primary)" }}>{selectedSeason.name} {selectedSeason.year}</span>
        </div>
      )}

      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: "var(--bg-surface)" }}>
        {TABS.map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{ background: tab === t ? "var(--accent)" : "transparent", color: tab === t ? "#fff" : "var(--text-muted)" }}>
            {t}
          </button>
        ))}
      </div>

      {tab === "Seasons" && <SeasonsTab onSelect={handleSelectSeason} />}
      {tab === "Matings" && <MatingsTab season={selectedSeason} />}
      {tab === "Generate" && <GenerateTab season={selectedSeason} />}
      {tab === "Lifecycle" && <LifecycleTab season={selectedSeason} />}
    </div>
  );
}
