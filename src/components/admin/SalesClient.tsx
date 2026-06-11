"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Pencil, TrendingUp, CheckCircle2, XCircle, Zap, User, ExternalLink } from "lucide-react";

interface SaleItem { bloodline: string; category: string | null; quantity: number; unitPrice: number }

interface Sale {
  _id: string;
  source: "manual" | "reservation";
  description: string;
  amount: number;
  date: string;
  month: number; year: number;
  paymentStatus: "paid" | "partial" | "unpaid";
  notes?: string;
  // reservation fields
  reservationId?: string;
  listingType?: string;
  listingName?: string;
  listingSlug?: string;
  buyerName?: string;
  buyerFacebook?: string;
  buyerNumber?: string;
  items?: SaleItem[];
  downPayment?: number;
  balance?: number;
  paymentPlan?: string;
}

const STATUS_STYLE = {
  paid:    { bg: "var(--success)18", color: "var(--success)",  label: "Paid"    },
  partial: { bg: "var(--warning)18", color: "var(--warning)",  label: "Partial" },
  unpaid:  { bg: "var(--danger)18",  color: "var(--danger)",   label: "Unpaid"  },
};

const TYPE_STYLE: Record<string, { bg: string; color: string; label: string }> = {
  pahulugan:    { bg: "var(--accent)18",  color: "var(--accent)",  label: "Pahulugan"   },
  "months-old": { bg: "var(--success)18", color: "var(--success)", label: "Months Old"  },
  "day-old":    { bg: "var(--warning)18", color: "var(--warning)", label: "Day Old"     },
  manual:       { bg: "var(--text-faint)18", color: "var(--text-muted)", label: "Manual" },
};

function fmt(n: number | null | undefined) {
  return `₱${(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function SalesClient() {
  const router = useRouter();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [form, setForm] = useState({ description: "", amount: "", date: new Date().toISOString().slice(0, 10), paymentStatus: "paid", notes: "" });

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/sales?month=${month}&year=${year}`);
    const j = await r.json();
    setSales(j.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month, year]);

  function openNew() {
    setEditing(null);
    setForm({ description: "", amount: "", date: new Date().toISOString().slice(0, 10), paymentStatus: "paid", notes: "" });
    setShowForm(true);
  }

  function openEdit(s: Sale) {
    setEditing(s);
    setForm({ description: s.description, amount: String(s.amount), date: s.date.slice(0, 10), paymentStatus: s.paymentStatus, notes: s.notes ?? "" });
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const d = new Date(form.date);
    const payload = { ...form, amount: parseFloat(form.amount), month: d.getMonth() + 1, year: d.getFullYear() };
    if (editing) {
      await fetch(`/api/sales/${editing._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...payload, source: "manual" }) });
    }
    setShowForm(false); setEditing(null); load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sale?")) return;
    await fetch(`/api/sales/${id}`, { method: "DELETE" });
    load();
  }

  // saleBalance: what's still owed on a single sale record
  function saleBalance(e: Sale): number {
    if (e.paymentStatus === "paid") return 0;
    if (e.balance != null) return e.balance;
    if (e.downPayment != null) return Math.max(0, e.amount - e.downPayment);
    return e.amount;
  }
  const outstanding = sales.reduce((s, e) => s + saleBalance(e), 0);
  // totalRevenue = money actually collected (not full order value for unpaid orders)
  const totalRevenue = sales.reduce((s, e) => s + (e.amount - saleBalance(e)), 0);
  // totalOrders = full contract value of all orders
  const total = sales.reduce((s, e) => s + e.amount, 0);
  const autoCount = sales.filter((s) => s.source === "reservation").length;

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Sales</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            {MONTHS[month - 1]} {year} · {sales.length} record{sales.length !== 1 ? "s" : ""}{autoCount > 0 ? ` · ${autoCount} from reservations` : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={month} onChange={(e) => setMonth(+e.target.value)} className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(+e.target.value)} className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={openNew} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
            <Plus size={15} /> Add Sale
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">

        {/* Total Revenue = actually collected money */}
        <div className="col-span-2 md:col-span-1 rounded-[14px] p-5 flex flex-col justify-between" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--success)15" }}>
              <TrendingUp size={16} style={{ color: "var(--success)" }} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Total Revenue</span>
          </div>
          <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--success)" }}>{fmt(totalRevenue)}</div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Money actually collected</p>
        </div>

        {/* Total Orders = full contract value */}
        <div className="rounded-[14px] p-4 flex flex-col justify-between" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <CheckCircle2 size={12} style={{ color: "var(--accent)" }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Total Orders</span>
          </div>
          <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{fmt(total)}</div>
          <div className="mt-2 h-1 rounded-full" style={{ background: "var(--border)" }}>
            <div className="h-1 rounded-full" style={{ width: total > 0 ? `${Math.round((totalRevenue / total) * 100)}%` : "0%", background: "var(--accent)" }} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>{total > 0 ? Math.round((totalRevenue / total) * 100) : 0}% collected</p>
        </div>

        {/* Collectible balance (actual amount still owed) */}
        <div className="rounded-[14px] p-4 flex flex-col justify-between" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-1.5 mb-2">
            <XCircle size={12} style={{ color: "var(--danger)" }} />
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Collectible</span>
          </div>
          <div className="text-lg font-bold" style={{ color: outstanding > 0 ? "var(--danger)" : "var(--success)" }}>{fmt(outstanding)}</div>
          <div className="mt-2 h-1 rounded-full" style={{ background: "var(--border)" }}>
            <div className="h-1 rounded-full" style={{ width: total > 0 ? `${Math.round((outstanding / total) * 100)}%` : "0%", background: "var(--danger)" }} />
          </div>
          <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>Actual balance owed</p>
        </div>

        {/* Status breakdown */}
        <div className="rounded-[14px] p-4 flex flex-col gap-2 justify-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          {[
            { label: "Paid",    color: "var(--success)", count: sales.filter(s => s.paymentStatus === "paid").length },
            { label: "Partial", color: "var(--warning)", count: sales.filter(s => s.paymentStatus === "partial").length },
            { label: "Unpaid",  color: "var(--danger)",  count: sales.filter(s => s.paymentStatus === "unpaid").length },
          ].map(({ label, color, count }) => (
            <div key={label} className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</span>
              </div>
              <span className="text-xs font-mono font-bold" style={{ color }}>{count}</span>
            </div>
          ))}
        </div>

      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-[14px] p-5 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{editing ? "Edit Sale" : "New Manual Sale"}</h2>
          <form onSubmit={handleSave} className="space-y-3">
            <input placeholder="Description *" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} style={inputStyle} />
            <div className="grid grid-cols-2 gap-3">
              <input type="number" placeholder="Amount *" required value={form.amount} min={0} step="any" onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} style={inputStyle} />
              <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} style={inputStyle} />
            </div>
            <div className="flex gap-2">
              {(["paid", "partial", "unpaid"] as const).map((s) => (
                <button key={s} type="button" onClick={() => setForm({ ...form, paymentStatus: s })}
                  className="flex-1 py-2 rounded-lg text-xs font-semibold capitalize transition-all"
                  style={{
                    background: form.paymentStatus === s ? STATUS_STYLE[s].bg : "var(--bg-raised)",
                    color: form.paymentStatus === s ? STATUS_STYLE[s].color : "var(--text-muted)",
                    border: `1px solid ${form.paymentStatus === s ? STATUS_STYLE[s].color : "var(--border)"}`,
                  }}>{STATUS_STYLE[s].label}</button>
              ))}
            </div>
            <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} style={inputStyle} />
            <div className="flex gap-2 justify-end pt-1">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Sales list */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />)}</div>
      ) : sales.length === 0 ? (
        <div className="rounded-[14px] py-20 text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text-faint)" }}>No sales for {MONTHS[month - 1]} {year}</p>
        </div>
      ) : (
        <>
        {/* ── Desktop table ── */}
        <div className="hidden md:block rounded-[14px] overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          {/* Table header */}
          <div className="grid text-[11px] font-semibold uppercase tracking-widest px-5 py-3"
            style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", color: "var(--text-faint)", gridTemplateColumns: "90px 100px 1fr 100px 110px 56px" }}>
            <span>Date</span><span>Type</span><span>Description</span><span>Status</span><span className="text-right">Amount</span><span />
          </div>

          {sales.map((s, i) => {
            const st = STATUS_STYLE[s.paymentStatus];
            const typeKey = s.source === "reservation" ? (s.listingType ?? "manual") : "manual";
            const ts = TYPE_STYLE[typeKey] ?? TYPE_STYLE.manual;
            const isOpen = expanded === s._id;

            return (
              <div key={s._id} style={{ borderBottom: i < sales.length - 1 ? "1px solid var(--border)" : "none" }}>
                {/* Main row */}
                <div className="grid items-center px-5 py-3.5 cursor-pointer transition-colors"
                  onClick={() => setExpanded(isOpen ? null : s._id)}
                  style={{ gridTemplateColumns: "90px 100px 1fr 100px 110px 56px", background: i % 2 === 0 ? "var(--bg-base)" : "var(--bg-surface)" }}>

                  <span className="text-xs font-mono" style={{ color: "var(--text-faint)" }}>
                    {new Date(s.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                  </span>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md w-fit"
                    style={{ background: ts.bg, color: ts.color }}>
                    {s.source === "reservation" ? <Zap size={10} /> : <User size={10} />}
                    {ts.label}
                  </span>

                  <div>
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{s.description}</p>
                    {s.source === "reservation" && s.buyerName && (
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{s.buyerName}</p>
                    )}
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md w-fit"
                    style={{ background: st.bg, color: st.color }}>
                    {st.label}
                  </span>

                  <span className="text-sm font-mono font-bold text-right" style={{ color: "var(--success)" }}>
                    {fmt(s.amount)}
                  </span>

                  <div className="flex gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg" style={{ color: "var(--accent)", background: "var(--accent)10" }}><Pencil size={13} /></button>
                    <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg" style={{ color: "var(--danger)", background: "var(--danger)10" }}><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Expanded detail panel — reservation sales */}
                {isOpen && s.source === "reservation" && (
                  <div className="px-5 py-4 space-y-3" style={{ background: "var(--bg-raised)", borderTop: "1px solid var(--border)" }}>

                    {/* Buyer info + reservation link */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Buyer name — clickable, goes to reservation */}
                      {s.buyerName && (
                        <button
                          onClick={() => s.listingSlug && router.push(`/admin/reservations/${s.listingSlug}?r=${s.reservationId}`)}
                          className="rounded-lg px-3 py-2 text-left transition-all group"
                          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", cursor: s.listingSlug ? "pointer" : "default" }}>
                          <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5 flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
                            Buyer {s.listingSlug && <ExternalLink size={9} />}
                          </p>
                          <p className="text-sm font-medium group-hover:underline" style={{ color: s.listingSlug ? "var(--accent)" : "var(--text-primary)" }}>{s.buyerName}</p>
                        </button>
                      )}
                      {[
                        { label: "Facebook", value: s.buyerFacebook },
                        { label: "Contact",  value: s.buyerNumber  },
                      ].map(({ label, value }) => value ? (
                        <div key={label} className="rounded-lg px-3 py-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                          <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: "var(--text-faint)" }}>{label}</p>
                          <p className="text-sm" style={{ color: "var(--text-primary)" }}>{value}</p>
                        </div>
                      ) : null)}
                    </div>

                    {/* Payment breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { label: "Total",       value: fmt(s.amount),      color: "var(--success)" },
                        { label: "Down payment", value: fmt(s.downPayment), color: "var(--accent)"  },
                        { label: "Balance",      value: fmt(s.balance),     color: s.balance && s.balance > 0 ? "var(--warning)" : "var(--success)" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-lg px-3 py-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                          <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: "var(--text-faint)" }}>{label}</p>
                          <p className="text-sm font-mono font-bold" style={{ color }}>{value}</p>
                        </div>
                      ))}
                    </div>

                    {/* Items */}
                    {s.items && s.items.length > 0 && (
                      <div>
                        <p className="text-[10px] uppercase tracking-widest font-semibold mb-2" style={{ color: "var(--text-faint)" }}>Items ordered</p>
                        <div className="space-y-1.5">
                          {s.items.map((it, idx) => (
                            <div key={idx} className="flex items-center justify-between rounded-lg px-3 py-2"
                              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                              <div>
                                <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{it.bloodline}</span>
                                {it.category && <span className="text-xs ml-2" style={{ color: "var(--text-faint)" }}>{it.category}</span>}
                              </div>
                              <div className="flex items-center gap-4 text-xs font-mono">
                                <span style={{ color: "var(--text-muted)" }}>×{it.quantity}</span>
                                <span style={{ color: "var(--text-muted)" }}>{fmt(it.unitPrice)} / head</span>
                                <span className="font-bold" style={{ color: "var(--success)" }}>{fmt(it.quantity * it.unitPrice)}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Payment plan + notes */}
                    <div className="flex items-center gap-3 flex-wrap">
                      {s.paymentPlan && (
                        <span className="text-xs px-2 py-1 rounded-lg capitalize" style={{ background: "var(--accent)15", color: "var(--accent)" }}>
                          Plan: {s.paymentPlan}
                        </span>
                      )}
                      {s.notes && <span className="text-xs" style={{ color: "var(--text-faint)" }}>{s.notes}</span>}
                    </div>
                  </div>
                )}

                {/* Expanded detail — manual sales */}
                {isOpen && s.source === "manual" && s.notes && (
                  <div className="px-5 py-3" style={{ background: "var(--bg-raised)", borderTop: "1px solid var(--border)" }}>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>{s.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Mobile cards ── */}
        <div className="md:hidden space-y-2">
          {sales.map((s) => {
            const st = STATUS_STYLE[s.paymentStatus];
            const typeKey = s.source === "reservation" ? (s.listingType ?? "manual") : "manual";
            const ts = TYPE_STYLE[typeKey] ?? TYPE_STYLE.manual;
            const isOpen = expanded === s._id;
            return (
              <div key={s._id} className="rounded-[12px] overflow-hidden" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                {/* Card header row */}
                <div className="flex items-start gap-3 px-4 py-3 cursor-pointer" onClick={() => setExpanded(isOpen ? null : s._id)}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{s.description}</p>
                    {s.source === "reservation" && s.buyerName && (
                      <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-faint)" }}>{s.buyerName}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: ts.bg, color: ts.color }}>
                        {s.source === "reservation" ? <Zap size={9} /> : <User size={9} />}
                        {ts.label}
                      </span>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md"
                        style={{ background: st.bg, color: st.color }}>
                        {st.label}
                      </span>
                      <span className="text-[11px] font-mono" style={{ color: "var(--text-faint)" }}>
                        {new Date(s.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className="text-base font-mono font-bold" style={{ color: "var(--success)" }}>{fmt(s.amount)}</span>
                    <div className="flex gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openEdit(s)} className="p-1.5 rounded-lg" style={{ color: "var(--accent)", background: "var(--accent)10" }}><Pencil size={13} /></button>
                      <button onClick={() => handleDelete(s._id)} className="p-1.5 rounded-lg" style={{ color: "var(--danger)", background: "var(--danger)10" }}><Trash2 size={13} /></button>
                    </div>
                  </div>
                </div>

                {/* Expanded — reservation */}
                {isOpen && s.source === "reservation" && (
                  <div className="px-4 pb-4 space-y-3 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>
                    <div className="pt-3 grid grid-cols-1 gap-2">
                      {s.buyerName && (
                        <button
                          onClick={() => s.listingSlug && router.push(`/admin/reservations/${s.listingSlug}?r=${s.reservationId}`)}
                          className="rounded-lg px-3 py-2 text-left"
                          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", cursor: s.listingSlug ? "pointer" : "default" }}>
                          <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5 flex items-center gap-1" style={{ color: "var(--text-faint)" }}>
                            Buyer {s.listingSlug && <ExternalLink size={9} />}
                          </p>
                          <p className="text-sm font-medium" style={{ color: s.listingSlug ? "var(--accent)" : "var(--text-primary)" }}>{s.buyerName}</p>
                        </button>
                      )}
                      {[{ label: "Facebook", value: s.buyerFacebook }, { label: "Contact", value: s.buyerNumber }].map(({ label, value }) => value ? (
                        <div key={label} className="rounded-lg px-3 py-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                          <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: "var(--text-faint)" }}>{label}</p>
                          <p className="text-sm" style={{ color: "var(--text-primary)" }}>{value}</p>
                        </div>
                      ) : null)}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: "Total", value: fmt(s.amount), color: "var(--success)" },
                        { label: "Down", value: fmt(s.downPayment), color: "var(--accent)" },
                        { label: "Balance", value: fmt(s.balance), color: s.balance && s.balance > 0 ? "var(--warning)" : "var(--success)" },
                      ].map(({ label, value, color }) => (
                        <div key={label} className="rounded-lg px-2 py-2" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                          <p className="text-[10px] uppercase tracking-widest font-semibold mb-0.5" style={{ color: "var(--text-faint)" }}>{label}</p>
                          <p className="text-xs font-mono font-bold" style={{ color }}>{value}</p>
                        </div>
                      ))}
                    </div>
                    {s.items && s.items.length > 0 && (
                      <div className="space-y-1.5">
                        <p className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "var(--text-faint)" }}>Items</p>
                        {s.items.map((it, idx) => (
                          <div key={idx} className="flex items-center justify-between rounded-lg px-3 py-2"
                            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
                            <span className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{it.bloodline}</span>
                            <span className="text-xs font-mono font-bold" style={{ color: "var(--success)" }}>{fmt(it.quantity * it.unitPrice)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Expanded — manual */}
                {isOpen && s.source === "manual" && s.notes && (
                  <div className="px-4 py-3 border-t" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>
                    <p className="text-xs" style={{ color: "var(--text-faint)" }}>{s.notes}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}
