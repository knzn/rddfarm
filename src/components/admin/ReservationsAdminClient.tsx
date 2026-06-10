"use client";

import { useEffect, useState } from "react";
import { Plus, Check, X, Trash2, ChevronDown, ChevronUp } from "lucide-react";

type ListingType = "pahulugan" | "months-old" | "day-old";

interface Listing {
  _id: string; name: string; slug: string; type: ListingType; releaseDate: string;
  bloodlines: { name: string; closed: boolean }[];
  prices: { category: string; amount: number }[];
  isDone: boolean;
}

interface Reservation {
  _id: string; buyerName: string; buyerFacebook: string; buyerNumber: string;
  listingSlug: string; totalAmount: number; downPayment: number; balance: number;
  paymentPlan: string; isConfirmed: boolean; publicUrl: string; createdAt: string;
  items: { bloodline: string; category?: string; quantity: number; unitPrice: number }[];
}

const TABS: { key: ListingType; label: string }[] = [
  { key: "pahulugan", label: "Pahulugan" },
  { key: "months-old", label: "Months Old" },
  { key: "day-old", label: "Day Old" },
];

function fmt(n: number | null | undefined) { return `₱${(n ?? 0).toLocaleString()}`; }

const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";

export default function ReservationsAdminClient() {
  const [tab, setTab] = useState<ListingType>("pahulugan");
  const [subTab, setSubTab] = useState<"listings" | "reservations">("listings");
  const [listings, setListings] = useState<Listing[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editListing, setEditListing] = useState<Listing | null>(null);
  const [expandedResv, setExpandedResv] = useState<string | null>(null);

  // listing form
  const emptyForm = () => ({ name: "", releaseDate: "", startDate: "", bloodlines: [{ name: "", closed: false }], prices: [{ category: "", amount: "" }] });
  const [form, setForm] = useState(emptyForm());

  async function loadListings() {
    setLoading(true);
    const r = await fetch(`/api/listings?type=${tab}`);
    const j = await r.json();
    setListings(j.data ?? []);
    setLoading(false);
  }

  async function loadReservations() {
    setLoading(true);
    const r = await fetch(`/api/admin/reservations?type=${tab}`);
    const j = await r.json();
    setReservations(j.data ?? []);
    setLoading(false);
  }

  useEffect(() => {
    if (subTab === "listings") loadListings();
    else loadReservations();
  }, [tab, subTab]);

  async function saveListing(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      type: tab,
      name: form.name,
      releaseDate: form.releaseDate,
      startDate: form.startDate || undefined,
      bloodlines: form.bloodlines.filter((b) => b.name.trim()),
      prices: form.prices.filter((p) => p.category.trim()).map((p) => ({ ...p, amount: +p.amount })),
    };
    if (editListing) {
      await fetch(`/api/listings/${editListing.slug}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/listings", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false); setEditListing(null); setForm(emptyForm()); loadListings();
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

  async function confirmReservation(id: string) {
    await fetch(`/api/admin/reservations/${id}/confirm`, { method: "PATCH" }); loadReservations();
  }

  async function rejectReservation(id: string) {
    if (!confirm("Reject and delete this reservation?")) return;
    await fetch(`/api/admin/reservations/${id}/reject`, { method: "PATCH" }); loadReservations();
  }

  function startEditListing(l: Listing) {
    setEditListing(l);
    setForm({
      name: l.name,
      releaseDate: l.releaseDate.slice(0, 10),
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

  function initPrices() {
    return defaultCategories[tab].map((c) => ({ category: c, amount: "" }));
  }

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

      {/* Sub tabs */}
      <div className="flex gap-4 mb-6 border-b" style={{ borderColor: "var(--border)" }}>
        {(["listings", "reservations"] as const).map((s) => (
          <button key={s} onClick={() => setSubTab(s)}
            className="pb-2 text-sm font-medium capitalize transition-all"
            style={{ borderBottom: subTab === s ? "2px solid var(--accent)" : "2px solid transparent", color: subTab === s ? "var(--accent)" : "var(--text-muted)" }}>
            {s}
          </button>
        ))}
      </div>

      {/* LISTINGS TAB */}
      {subTab === "listings" && (
        <>
          <div className="flex justify-end mb-4">
            <button onClick={() => { setEditListing(null); setForm({ ...emptyForm(), prices: initPrices() }); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{ background: "var(--accent)", color: "#fff" }}>
              <Plus size={15} /> New Listing
            </button>
          </div>

          {showForm && (
            <div className="rounded-[12px] p-5 mb-6 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
              <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{editListing ? "Edit Listing" : `New ${tab} Listing`}</h2>
              <form onSubmit={saveListing} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <input placeholder="Listing Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={inputStyle} />
                  <input type="date" required value={form.releaseDate} onChange={(e) => setForm({ ...form, releaseDate: e.target.value })} className={inputCls} style={inputStyle} />
                  {tab === "pahulugan" && (
                    <input type="date" placeholder="Start date (optional)" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className={inputCls} style={inputStyle} />
                  )}
                </div>

                {/* Bloodlines */}
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

                {/* Prices */}
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

                <div className="flex gap-2 justify-end">
                  <button type="button" onClick={() => { setShowForm(false); setEditListing(null); }} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
                  <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
                </div>
              </form>
            </div>
          )}

          {loading ? (
            <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />)}</div>
          ) : listings.length === 0 ? (
            <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>No listings yet</div>
          ) : (
            <div className="space-y-3">
              {listings.map((l) => (
                <div key={l._id} className="rounded-[12px] p-5 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{l.name}</span>
                        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: l.isDone ? "var(--text-faint)20" : "var(--success)20", color: l.isDone ? "var(--text-faint)" : "var(--success)" }}>
                          {l.isDone ? "Done" : "Active"}
                        </span>
                      </div>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>Release: {new Date(l.releaseDate).toLocaleDateString()}</p>
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {l.bloodlines.map((b, i) => (
                          <button key={i} onClick={() => toggleBloodlineClosed(l, i)}
                            className="text-xs px-2 py-0.5 rounded-full transition-all"
                            style={{ background: b.closed ? "var(--danger)20" : "var(--success)20", color: b.closed ? "var(--danger)" : "var(--success)", border: `1px solid ${b.closed ? "var(--danger)" : "var(--success)"}40` }}>
                            {b.name} {b.closed ? "● Full" : "● Open"}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <button onClick={() => startEditListing(l)} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--accent)" }}>Edit</button>
                      <button onClick={() => toggleDone(l)} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: l.isDone ? "var(--success)" : "var(--text-muted)" }}>{l.isDone ? "Re-open" : "Mark Done"}</button>
                      <button onClick={() => deleteListing(l.slug)} className="p-1.5 rounded-lg" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* RESERVATIONS TAB */}
      {subTab === "reservations" && (
        <>
          {loading ? (
            <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />)}</div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>No reservations yet</div>
          ) : (
            <div className="space-y-3">
              {reservations.map((r) => {
                const isOpen = expandedResv === r._id;
                return (
                  <div key={r._id} className="rounded-[12px] border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                    <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpandedResv(isOpen ? null : r._id)}>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{r.buyerName}</span>
                          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: r.isConfirmed ? "var(--success)20" : "var(--warning)20", color: r.isConfirmed ? "var(--success)" : "var(--warning)" }}>
                            {r.isConfirmed ? "Confirmed" : "Pending"}
                          </span>
                        </div>
                        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{r.listingSlug} · {fmt(r.totalAmount)} total · {r.paymentPlan}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {!r.isConfirmed && (
                          <>
                            <button onClick={(e) => { e.stopPropagation(); confirmReservation(r._id); }} className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium" style={{ background: "var(--success)", color: "#fff" }}><Check size={12} /> Confirm</button>
                            <button onClick={(e) => { e.stopPropagation(); rejectReservation(r._id); }} className="p-1.5 rounded-lg" style={{ color: "var(--danger)" }}><X size={14} /></button>
                          </>
                        )}
                        {isOpen ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}
                      </div>
                    </div>
                    {isOpen && (
                      <div className="px-5 pb-5 border-t pt-4 space-y-2" style={{ borderColor: "var(--border)" }}>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>FB: {r.buyerFacebook} · {r.buyerNumber}</p>
                        {r.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span style={{ color: "var(--text-muted)" }}>{item.bloodline} {item.category ? `(${item.category})` : ""} × {item.quantity}</span>
                            <span className="font-mono" style={{ color: "var(--text-primary)" }}>{fmt(item.quantity * item.unitPrice)}</span>
                          </div>
                        ))}
                        <div className="pt-2 border-t text-sm font-mono space-y-0.5" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
                          <div className="flex justify-between"><span>Total</span><span style={{ color: "var(--text-primary)" }}>{fmt(r.totalAmount)}</span></div>
                          <div className="flex justify-between"><span>Down Payment</span><span style={{ color: "var(--warning)" }}>{fmt(r.downPayment)}</span></div>
                          <div className="flex justify-between"><span>Balance</span><span style={{ color: "var(--danger)" }}>{fmt(r.balance)}</span></div>
                        </div>
                        {r.isConfirmed && (
                          <p className="text-xs mt-2" style={{ color: "var(--success)" }}>Public link: {r.publicUrl}</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
