"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X, Trash2, ChevronRight } from "lucide-react";

type ListingType = "pahulugan" | "months-old" | "day-old";

interface Listing {
  _id: string; name: string; slug: string; type: ListingType;
  releaseMonthStart: number; releaseMonthEnd: number; releaseYear: number;
  bloodlines: { name: string; closed: boolean }[];
  prices: { category: string; amount: number }[];
  isDone: boolean;
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const YEARS = [2025, 2026, 2027, 2028, 2029];
function fmtRelease(l: Listing) {
  return `${MONTHS[l.releaseMonthStart - 1]} – ${MONTHS[l.releaseMonthEnd - 1]} ${l.releaseYear}`;
}

const TABS: { key: ListingType; label: string }[] = [
  { key: "pahulugan", label: "Pahulugan" },
  { key: "months-old", label: "Months Old" },
  { key: "day-old", label: "Day Old" },
];

const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";

export default function ReservationsAdminClient() {
  const router = useRouter();
  const [tab, setTab] = useState<ListingType>("pahulugan");
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [saveError, setSaveError] = useState("");

  const curYear = new Date().getFullYear();
  const emptyForm = () => ({ name: "", releaseMonthStart: "1", releaseMonthEnd: "1", releaseYear: String(curYear + 1), startDate: "", bloodlines: [{ name: "", closed: false }], prices: [{ category: "", amount: "" }] });
  const [form, setForm] = useState(emptyForm());

  async function loadListings() {
    setLoading(true);
    const r = await fetch(`/api/listings?type=${tab}`);
    const j = await r.json();
    setListings(j.data ?? []);
    setLoading(false);
  }

  useEffect(() => { loadListings(); }, [tab]);

  async function saveListing(e: React.FormEvent) {
    e.preventDefault();
    setSaveError("");
    const payload = {
      type: tab,
      name: form.name,
      releaseMonthStart: +form.releaseMonthStart,
      releaseMonthEnd: +form.releaseMonthEnd,
      releaseYear: +form.releaseYear,
      startDate: form.startDate || undefined,
      bloodlines: form.bloodlines.filter((b) => b.name.trim()),
      prices: form.prices.filter((p) => p.category.trim()).map((p) => ({ ...p, amount: +p.amount })),
    };
    const res = editListing
      ? await fetch(`/api/listings/${editListing.slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) })
      : await fetch("/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      const j = await res.json();
      setSaveError(j.error ?? "Save failed");
      return;
    }
    setShowForm(false); setEditListing(null); setForm(emptyForm()); setSaveError(""); loadListings();
  }

  async function deleteListing(slug: string) {
    if (!confirm("Delete this listing?")) return;
    await fetch(`/api/listings/${slug}`, { method: "DELETE" }); loadListings();
  }

  async function toggleDone(l: Listing) {
    await fetch(`/api/listings/${l.slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isDone: !l.isDone }) });
    loadListings();
  }

  async function toggleBloodlineClosed(l: Listing, bIdx: number) {
    const updated = l.bloodlines.map((b, i) => i === bIdx ? { ...b, closed: !b.closed } : b);
    await fetch(`/api/listings/${l.slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bloodlines: updated }) });
    loadListings();
  }

  function startEditListing(l: Listing) {
    setEditListing(l);
    setForm({
      name: l.name,
      releaseMonthStart: String(l.releaseMonthStart),
      releaseMonthEnd: String(l.releaseMonthEnd),
      releaseYear: String(l.releaseYear),
      startDate: "",
      bloodlines: l.bloodlines.length ? l.bloodlines : [{ name: "", closed: false }],
      prices: l.prices.length ? l.prices.map((p) => ({ ...p, amount: String(p.amount) })) : [{ category: "", amount: "" }],
    });
    setShowForm(true);
  }

  const defaultCategories: Record<ListingType, string[]> = {
    pahulugan: ["Stag", "Pullet", "Pair", "Trio", "Quadro"],
    "months-old": ["per-head"],
    "day-old": ["per-head"],
  };

  return (
    <div>
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-6" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Reservations</h1>

      {/* Type tabs */}
      <div className="flex gap-1 mb-6 p-1 rounded-lg w-fit" style={{ background: "var(--bg-surface)" }}>
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className="px-4 py-1.5 rounded-md text-sm font-medium transition-all"
            style={{ background: tab === t.key ? "var(--accent)" : "transparent", color: tab === t.key ? "#fff" : "var(--text-muted)" }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex justify-end mb-4">
        <button onClick={() => { setEditListing(null); setForm({ ...emptyForm(), prices: defaultCategories[tab].map((c) => ({ category: c, amount: "" })) }); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ background: "var(--accent)", color: "#fff" }}>
          <Plus size={15} /> New Listing
        </button>
      </div>

      {/* Create / Edit form */}
      {showForm && (
        <div className="rounded-[12px] p-5 mb-6 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{editListing ? "Edit Listing" : `New ${tab} Listing`}</h2>
          <form onSubmit={saveListing} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <input placeholder="Listing Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={inputStyle} />
              <select value={form.releaseYear} onChange={(e) => setForm({ ...form, releaseYear: e.target.value })} className={inputCls} style={inputStyle}>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>Release Period</p>
              <div className="flex items-center gap-2">
                <select value={form.releaseMonthStart} onChange={(e) => setForm({ ...form, releaseMonthStart: e.target.value })} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
                <span className="text-sm" style={{ color: "var(--text-faint)" }}>to</span>
                <select value={form.releaseMonthEnd} onChange={(e) => setForm({ ...form, releaseMonthEnd: e.target.value })} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
              <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>
                Preview: {MONTHS[+form.releaseMonthStart - 1]} – {MONTHS[+form.releaseMonthEnd - 1]} {form.releaseYear}
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>Bloodlines</p>
              <div className="space-y-2">
                {form.bloodlines.map((b, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input placeholder={`Bloodline ${i + 1}`} value={b.name} onChange={(e) => setForm({ ...form, bloodlines: form.bloodlines.map((x, j) => j === i ? { ...x, name: e.target.value } : x) })} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
                    <button type="button" onClick={() => setForm({ ...form, bloodlines: form.bloodlines.filter((_, j) => j !== i) })} className="p-1.5" style={{ color: "var(--danger)" }}><X size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, bloodlines: [...form.bloodlines, { name: "", closed: false }] })} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--accent)" }}>+ Add Bloodline</button>
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>Prices</p>
              <div className="space-y-2">
                {form.prices.map((p, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <input placeholder="Category" value={p.category} onChange={(e) => setForm({ ...form, prices: form.prices.map((x, j) => j === i ? { ...x, category: e.target.value } : x) })} className="flex-1 rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
                    <input type="number" placeholder="Amount" value={p.amount} onChange={(e) => setForm({ ...form, prices: form.prices.map((x, j) => j === i ? { ...x, amount: e.target.value } : x) })} className="rounded-lg px-3 py-2 text-sm outline-none" style={{ ...inputStyle, width: 130 }} />
                    <button type="button" onClick={() => setForm({ ...form, prices: form.prices.filter((_, j) => j !== i) })} className="p-1.5" style={{ color: "var(--danger)" }}><X size={14} /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setForm({ ...form, prices: [...form.prices, { category: "", amount: "" }] })} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--accent)" }}>+ Add Price</button>
              </div>
            </div>

            {saveError && <p className="text-sm text-center" style={{ color: "var(--danger)" }}>{saveError}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditListing(null); }} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Listing cards */}
      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />)}</div>
      ) : listings.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>No listings yet</div>
      ) : (
        <div className="space-y-3">
          {listings.map((l) => (
            <div key={l._id} className="rounded-[12px] border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              {/* Clickable header → listing reservations page */}
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-white/5 transition-colors"
                onClick={() => router.push(`/admin/reservations/${l.slug}`)}>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-base" style={{ color: "var(--accent)" }}>{l.name}</span>
                      <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: l.isDone ? "var(--text-faint)20" : "var(--success)20", color: l.isDone ? "var(--text-faint)" : "var(--success)" }}>
                        {l.isDone ? "Done" : "Active"}
                      </span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      Release: {fmtRelease(l)} · {l.bloodlines.length} bloodline{l.bloodlines.length !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs" style={{ color: "var(--text-faint)" }}>View Reservations</span>
                  <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                </div>
              </div>

              {/* Bloodlines + actions */}
              <div className="px-5 pb-4 border-t flex items-center justify-between flex-wrap gap-3" style={{ borderColor: "var(--border)" }}>
                <div className="flex flex-wrap gap-1.5 pt-3">
                  {l.bloodlines.map((b, i) => (
                    <button key={i} onClick={() => toggleBloodlineClosed(l, i)}
                      className="text-xs px-2 py-0.5 rounded-full transition-all"
                      style={{ background: b.closed ? "var(--danger)20" : "var(--success)20", color: b.closed ? "var(--danger)" : "var(--success)", border: `1px solid ${b.closed ? "var(--danger)" : "var(--success)"}40` }}>
                      {b.name} {b.closed ? "● Full" : "● Open"}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2 pt-3 shrink-0">
                  <button onClick={() => startEditListing(l)} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--accent)" }}>Edit</button>
                  <button onClick={() => toggleDone(l)} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: l.isDone ? "var(--success)" : "var(--text-muted)" }}>{l.isDone ? "Re-open" : "Mark Done"}</button>
                  <button onClick={() => deleteListing(l.slug)} className="p-1.5 rounded-lg" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
