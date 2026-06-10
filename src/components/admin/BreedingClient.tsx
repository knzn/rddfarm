"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Copy, Check, RefreshCw } from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────
interface Season {
  _id: string; name: string; year: number; markingsGenerated: boolean;
  generatedAt?: string; eggsLaid?: number; chicksHatched?: number; hatchRate?: number;
  expectedHatchDate?: string; maleCount?: number; femaleCount?: number; sexCountDone: boolean;
}
interface Hen { henName: string; marking?: string; penEggsLaid?: number; penChicksHatched?: number }
interface Mating {
  _id: string; maleName: string; malePhoto?: string; noseGroup?: string;
  sameMarking?: boolean; mandatoryMarking?: string;
  hens: Hen[];
  seasonId: string;
}
interface MarkingAssignment { matingId: string; maleName: string; noseGroup: string; hens: { henName: string; marking: string }[] }

const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";

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

function MatingsTab({ season }: { season: Season | null }) {
  const [matings, setMatings] = useState<Mating[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ maleName: "", sameMarking: "false", mandatoryMarking: "", hens: [{ henName: "" }] });

  async function load() {
    if (!season) return;
    const r = await fetch(`/api/seasons/${season._id}/matings`);
    const j = await r.json();
    setMatings(j.data ?? []);
  }
  useEffect(() => { load(); }, [season]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!season) return;
    const payload = {
      maleName: form.maleName,
      sameMarking: form.sameMarking === "true" ? true : form.sameMarking === "false" ? false : null,
      mandatoryMarking: form.mandatoryMarking || null,
      hens: form.hens.filter((h) => h.henName.trim()),
    };
    await fetch(`/api/seasons/${season._id}/matings`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setShowForm(false); setForm({ maleName: "", sameMarking: "false", mandatoryMarking: "", hens: [{ henName: "" }] }); load();
  }

  async function deleteMating(id: string) {
    if (!season) return;
    await fetch(`/api/seasons/${season._id}/matings/${id}`, { method: "DELETE" }); load();
  }

  if (!season) return <div className="text-center py-12" style={{ color: "var(--text-faint)" }}>Select a season from the Seasons tab first</div>;

  return (
    <div>
      <p className="text-sm font-medium mb-4" style={{ color: "var(--text-muted)" }}>Season: {season.name} {season.year}</p>
      <div className="flex justify-end mb-4">
        <button onClick={() => setShowForm(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}><Plus size={15} /> Add Mating</button>
      </div>

      {showForm && (
        <div className="rounded-[12px] p-5 mb-4 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <form onSubmit={create} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Stag name *" required value={form.maleName} onChange={(e) => setForm({ ...form, maleName: e.target.value })} className={inputCls} style={inputStyle} />
              <select value={form.sameMarking} onChange={(e) => setForm({ ...form, sameMarking: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="false">Unique markings per hen</option>
                <option value="true">Same marking for all hens</option>
                <option value="null">Not set</option>
              </select>
              <input placeholder="Mandatory marking (optional)" value={form.mandatoryMarking} onChange={(e) => setForm({ ...form, mandatoryMarking: e.target.value })} className={`col-span-2 ${inputCls}`} style={inputStyle} />
            </div>
            <div>
              <p className="text-xs font-semibold mb-2 uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Hens</p>
              <div className="space-y-2">
                {form.hens.map((h, i) => (
                  <div key={i} className="flex gap-2">
                    <input placeholder={`Hen ${i + 1} name`} value={h.henName} onChange={(e) => setForm({ ...form, hens: form.hens.map((x, j) => j === i ? { henName: e.target.value } : x) })} className={`flex-1 ${inputCls}`} style={inputStyle} />
                    {form.hens.length > 1 && <button type="button" onClick={() => setForm({ ...form, hens: form.hens.filter((_, j) => j !== i) })} className="p-1.5" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>}
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, hens: [...form.hens, { henName: "" }] })} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--accent)" }}>+ Add Hen</button>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {matings.length === 0 ? <div className="text-center py-12" style={{ color: "var(--text-faint)" }}>No matings yet</div>
        : (
          <div className="space-y-2">
            {matings.map((m) => (
              <div key={m._id} className="flex items-start justify-between px-5 py-4 rounded-[12px] border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div>
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{m.maleName}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{m.hens.length} hen{m.hens.length !== 1 ? "s" : ""}{m.noseGroup ? ` · ${m.noseGroup}` : ""}{m.mandatoryMarking ? ` · Mandatory: ${m.mandatoryMarking}` : ""}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {m.hens.map((h, i) => (
                      <span key={i} className="text-xs px-2 py-0.5 rounded-full" style={{ background: "var(--bg-raised)", color: h.marking ? "var(--accent)" : "var(--text-faint)", border: "1px solid var(--border)" }}>
                        {h.henName}{h.marking ? `: ${h.marking}` : ""}
                      </span>
                    ))}
                  </div>
                </div>
                <button onClick={() => deleteMating(m._id)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
              </div>
            ))}
          </div>
        )}
    </div>
  );
}

function GenerateTab({ season }: { season: Season | null }) {
  const [preview, setPreview] = useState<MarkingAssignment[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [swapState, setSwapState] = useState<{ matingId: string; henName: string } | null>(null);
  const [newMarking, setNewMarking] = useState("");
  const [swapError, setSwapError] = useState("");

  async function generate() {
    if (!season) return;
    setLoading(true); setPreview(null); setConfirmed(false);
    const r = await fetch(`/api/seasons/${season._id}/generate`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const j = await r.json();
    setPreview(j.preview ?? null);
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

  async function confirm() {
    if (!season || !preview) return;
    const r = await fetch(`/api/seasons/${season._id}/generate/confirm`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignments: preview }),
    });
    if (r.ok) setConfirmed(true);
  }

  async function reset() {
    if (!season || !window.confirm("Reset all markings?")) return;
    await fetch(`/api/seasons/${season._id}/generate`, { method: "DELETE" });
    setPreview(null); setConfirmed(false);
  }

  if (!season) return <div className="text-center py-12" style={{ color: "var(--text-faint)" }}>Select a season first</div>;

  return (
    <div>
      <p className="text-sm font-medium mb-4" style={{ color: "var(--text-muted)" }}>Season: {season.name} {season.year}</p>
      <div className="flex gap-3 mb-6 flex-wrap">
        <button onClick={generate} disabled={loading} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50" style={{ background: "var(--accent)", color: "#fff" }}>
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> {preview ? "Re-generate" : "Generate Preview"}
        </button>
        {preview && !confirmed && (
          <>
            <button onClick={confirm} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--success)", color: "#fff" }}><Check size={14} /> Confirm & Save</button>
            <button onClick={reset} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--danger)", color: "var(--danger)" }}>Reset</button>
          </>
        )}
        {confirmed && <span className="flex items-center gap-2 text-sm font-medium" style={{ color: "var(--success)" }}><Check size={14} /> Markings confirmed!</span>}
      </div>

      {preview && (
        <div className="space-y-4">
          {preview.map((a) => (
            <div key={a.matingId} className="rounded-[12px] border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <div className="px-5 py-3 border-b flex items-center justify-between" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>
                <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{a.maleName}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-mono" style={{ background: "var(--accent)20", color: "var(--accent)" }}>{a.noseGroup}</span>
              </div>
              <table className="w-full text-sm">
                <tbody>
                  {a.hens.map((h, i) => (
                    <tr key={i} style={{ borderBottom: i < a.hens.length - 1 ? "1px solid var(--border)" : "none" }}>
                      <td className="px-5 py-2.5" style={{ color: "var(--text-muted)" }}>{h.henName}</td>
                      <td className="px-5 py-2.5 font-mono font-semibold" style={{ color: "var(--accent)" }}>{h.marking}</td>
                      <td className="px-5 py-2.5 text-right">
                        {!confirmed && (
                          swapState?.matingId === a.matingId && swapState?.henName === h.henName ? (
                            <div className="flex gap-2 justify-end items-center">
                              <input value={newMarking} onChange={(e) => setNewMarking(e.target.value)} placeholder="New combo" className="rounded-lg px-2 py-1 text-xs outline-none" style={{ ...inputStyle, width: 120 }} />
                              <button onClick={doSwap} className="text-xs px-2 py-1 rounded" style={{ background: "var(--accent)", color: "#fff" }}>Apply</button>
                              <button onClick={() => { setSwapState(null); setSwapError(""); }} className="text-xs px-2 py-1 rounded" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
                            </div>
                          ) : (
                            <button onClick={() => { setSwapState({ matingId: a.matingId, henName: h.henName }); setNewMarking(""); setSwapError(""); }} className="text-xs px-2 py-1 rounded" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Swap</button>
                          )
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
          {swapError && <p className="text-sm" style={{ color: "var(--danger)" }}>{swapError}</p>}
        </div>
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
