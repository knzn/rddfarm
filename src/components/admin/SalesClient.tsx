"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil } from "lucide-react";

interface Sale {
  _id: string; description: string; amount: number; date: string;
  paymentStatus: "paid" | "partial" | "unpaid"; notes?: string;
}

const STATUS_COLORS = { paid: "var(--success)", partial: "var(--warning)", unpaid: "var(--danger)" };

function fmt(n: number | null | undefined) { return `₱${(n ?? 0).toLocaleString()}`; }

export default function SalesClient() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Sale | null>(null);
  const [form, setForm] = useState({ description: "", amount: "", date: new Date().toISOString().slice(0, 10), paymentStatus: "paid", notes: "" });

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/sales?month=${month}&year=${year}`);
    const j = await r.json();
    setSales(j.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month, year]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (editing) {
      await fetch(`/api/sales/${editing._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/sales", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false); setEditing(null);
    setForm({ description: "", amount: "", date: new Date().toISOString().slice(0, 10), paymentStatus: "paid", notes: "" });
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sale?")) return;
    await fetch(`/api/sales/${id}`, { method: "DELETE" });
    load();
  }

  function startEdit(s: Sale) {
    setEditing(s);
    setForm({ description: s.description, amount: String(s.amount), date: s.date.slice(0, 10), paymentStatus: s.paymentStatus, notes: s.notes ?? "" });
    setShowForm(true);
  }

  const total = sales.reduce((s, e) => s + e.amount, 0);
  const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
  const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Sales</h1>
        <button onClick={() => { setEditing(null); setShowForm(true); }} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
          <Plus size={15} /> Add Sale
        </button>
      </div>

      <div className="flex gap-3 mb-6 flex-wrap">
        <select value={month} onChange={(e) => setMonth(+e.target.value)} className={inputCls} style={{ ...inputStyle, width: 130 }}>
          {months.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
        </select>
        <select value={year} onChange={(e) => setYear(+e.target.value)} className={inputCls} style={{ ...inputStyle, width: 100 }}>
          {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
        <div className="ml-auto flex items-center font-mono font-bold text-sm" style={{ color: "var(--success)" }}>Total: {fmt(total)}</div>
      </div>

      {showForm && (
        <div className="rounded-[12px] p-5 mb-6 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{editing ? "Edit Sale" : "New Sale"}</h2>
          <form onSubmit={handleSave} className="grid grid-cols-2 gap-3">
            <div className="col-span-2"><input placeholder="Description *" required value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className={inputCls} style={inputStyle} /></div>
            <input type="number" placeholder="Amount *" required value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className={inputCls} style={inputStyle} />
            <input type="date" required value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className={inputCls} style={inputStyle} />
            <select value={form.paymentStatus} onChange={(e) => setForm({ ...form, paymentStatus: e.target.value })} className={inputCls} style={inputStyle}>
              <option value="paid">Paid</option><option value="partial">Partial</option><option value="unpaid">Unpaid</option>
            </select>
            <input placeholder="Notes (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className={inputCls} style={inputStyle} />
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--bg-surface)" }} />)}</div>
      ) : sales.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>No sales for {months[month - 1]} {year}</div>
      ) : (
        <div className="rounded-[12px] overflow-hidden border" style={{ borderColor: "var(--border)" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                {["Date", "Description", "Amount", "Status", ""].map((h) => <th key={h} className="px-4 py-3 text-left font-medium" style={{ color: "var(--text-faint)" }}>{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {sales.map((s, i) => (
                <tr key={s._id} style={{ background: i % 2 === 0 ? "var(--bg-base)" : "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
                  <td className="px-4 py-3 font-mono text-xs" style={{ color: "var(--text-muted)" }}>{new Date(s.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3" style={{ color: "var(--text-primary)" }}>{s.description}</td>
                  <td className="px-4 py-3 font-mono font-semibold" style={{ color: "var(--success)" }}>{fmt(s.amount)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 rounded-full text-xs capitalize" style={{ background: `${STATUS_COLORS[s.paymentStatus]}20`, color: STATUS_COLORS[s.paymentStatus] }}>{s.paymentStatus}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button onClick={() => startEdit(s)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--accent)" }}><Pencil size={14} /></button>
                      <button onClick={() => handleDelete(s._id)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
