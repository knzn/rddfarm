"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, Pencil, Package, Users, Sparkles, Pill, Syringe, Wallet } from "lucide-react";

const UNIT_CATEGORIES = ["feeds", "vitamins", "medicines", "deworming"] as const;
const DIRECT_CATEGORIES = ["workers_extra_budget", "miscellaneous"] as const;
const ALL_CATEGORIES = [...UNIT_CATEGORIES, ...DIRECT_CATEGORIES] as const;
type ExpenseCategory = typeof ALL_CATEGORIES[number];

const CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  feeds: "Feeds",
  vitamins: "Vitamins",
  medicines: "Medicines",
  deworming: "Deworming",
  workers_extra_budget: "Workers / Budget",
  miscellaneous: "Miscellaneous",
};

// All using the project palette — semi-transparent overlays on --bg-raised
const CATEGORY_STYLE: Record<ExpenseCategory, { bg: string; color: string }> = {
  feeds:                { bg: "var(--success)18", color: "var(--success)" },
  vitamins:             { bg: "var(--accent)18",  color: "var(--accent)"  },
  medicines:            { bg: "var(--danger)18",  color: "var(--danger)"  },
  deworming:            { bg: "var(--danger)12",  color: "var(--danger)"  },
  workers_extra_budget: { bg: "var(--accent)12",  color: "var(--accent)"  },
  miscellaneous:        { bg: "var(--warning)18", color: "var(--warning)" },
};

const CATEGORY_ICON: Record<ExpenseCategory, React.ReactNode> = {
  feeds:                <Package size={11} />,
  vitamins:             <Pill size={11} />,
  medicines:            <Pill size={11} />,
  deworming:            <Syringe size={11} />,
  workers_extra_budget: <Users size={11} />,
  miscellaneous:        <Sparkles size={11} />,
};

function isUnit(cat: string): cat is typeof UNIT_CATEGORIES[number] {
  return (UNIT_CATEGORIES as readonly string[]).includes(cat);
}

interface Expense {
  _id: string;
  category: ExpenseCategory;
  type: "unit" | "direct";
  date: string;
  month: number;
  year: number;
  name?: string;
  unit?: string;
  quantity?: number;
  pricePerUnit?: number;
  totalAmount?: number;
  description?: string;
  amount?: number;
  notes?: string;
  locked?: boolean;
  effectiveAmount: number;
}

const BLANK_UNIT = { category: "feeds" as ExpenseCategory, date: new Date().toISOString().slice(0, 10), name: "", unit: "bag", quantity: "", pricePerUnit: "", notes: "" };
const BLANK_DIRECT = { category: "workers_extra_budget" as ExpenseCategory, date: new Date().toISOString().slice(0, 10), description: "", amount: "", notes: "" };

function fmt(n: number | null | undefined) {
  return `₱${(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function CategoryPill({ cat }: { cat: ExpenseCategory }) {
  const s = CATEGORY_STYLE[cat];
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-md"
      style={{ background: s.bg, color: s.color }}>
      {CATEGORY_ICON[cat]}
      {CATEGORY_LABELS[cat]}
    </span>
  );
}

export default function ExpensesClient() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Expense | null>(null);
  const [formCat, setFormCat] = useState<ExpenseCategory>("feeds");
  const [unitForm, setUnitForm] = useState({ ...BLANK_UNIT });
  const [directForm, setDirectForm] = useState({ ...BLANK_DIRECT });

  async function load() {
    setLoading(true);
    const r = await fetch(`/api/expenses?month=${month}&year=${year}`);
    const j = await r.json();
    setExpenses(j.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [month, year]);

  function openNew() {
    setEditing(null); setFormCat("feeds");
    setUnitForm({ ...BLANK_UNIT }); setDirectForm({ ...BLANK_DIRECT });
    setShowForm(true);
  }

  function openEdit(exp: Expense) {
    setEditing(exp); setFormCat(exp.category);
    if (isUnit(exp.category)) {
      setUnitForm({ category: exp.category, date: exp.date.slice(0, 10), name: exp.name ?? "", unit: exp.unit ?? "bag", quantity: String(exp.quantity ?? ""), pricePerUnit: String(exp.pricePerUnit ?? ""), notes: exp.notes ?? "" });
    } else {
      setDirectForm({ category: exp.category, date: exp.date.slice(0, 10), description: exp.description ?? "", amount: String(exp.amount ?? ""), notes: exp.notes ?? "" });
    }
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    let payload: Record<string, unknown>;
    if (isUnit(formCat)) {
      const qty = parseFloat(unitForm.quantity);
      const ppu = parseFloat(unitForm.pricePerUnit);
      payload = { category: formCat, date: unitForm.date, name: unitForm.name, unit: unitForm.unit, quantity: qty, pricePerUnit: ppu, totalAmount: qty * ppu, notes: unitForm.notes || null, month, year };
    } else {
      payload = { category: formCat, date: directForm.date, description: directForm.description, amount: parseFloat(directForm.amount), notes: directForm.notes || null, month, year };
    }
    if (editing) {
      await fetch(`/api/expenses/${editing._id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/expenses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setShowForm(false); setEditing(null);
    load();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this expense?")) return;
    await fetch(`/api/expenses/${id}`, { method: "DELETE" });
    load();
  }

  const total = expenses.reduce((s, e) => s + (e.effectiveAmount ?? 0), 0);

  const kpiCats: ExpenseCategory[] = ["feeds", "vitamins", "medicines", "deworming", "workers_extra_budget", "miscellaneous"];
  const catTotals = kpiCats.map((cat) => ({
    cat,
    total: expenses.filter((e) => e.category === cat).reduce((s, e) => s + (e.effectiveAmount ?? 0), 0),
    count: expenses.filter((e) => e.category === cat).length,
  })).filter((c) => c.total > 0 || c.count > 0);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Expenses</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
            {MONTHS[month - 1]} {year} · {expenses.length} transaction{expenses.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select value={month} onChange={(e) => setMonth(+e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <select value={year} onChange={(e) => setYear(+e.target.value)}
            className="rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
            {[2024, 2025, 2026, 2027].map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <button onClick={openNew}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Plus size={15} /> Add Expense
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* Total card */}
        <div className="col-span-2 md:col-span-3 lg:col-span-2 rounded-[14px] p-5 flex flex-col justify-between"
          style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "var(--danger)15" }}>
              <Wallet size={16} style={{ color: "var(--danger)" }} />
            </div>
            <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>Total Spent</span>
          </div>
          <div className="text-3xl font-bold" style={{ fontFamily: "var(--font-heading)", color: "var(--danger)" }}>
            {fmt(total)}
          </div>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>{MONTHS[month - 1]} {year}</p>
        </div>

        {/* Per-category cards */}
        {catTotals.map(({ cat, total: t }) => {
          const s = CATEGORY_STYLE[cat];
          const pct = total > 0 ? Math.round((t / total) * 100) : 0;
          return (
            <div key={cat} className="rounded-[14px] p-4 flex flex-col justify-between"
              style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <span style={{ color: s.color }}>{CATEGORY_ICON[cat]}</span>
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--text-faint)" }}>
                  {CATEGORY_LABELS[cat]}
                </span>
              </div>
              <div className="text-lg font-bold" style={{ color: "var(--text-primary)" }}>{fmt(t)}</div>
              {/* mini bar */}
              <div className="mt-2 h-1 rounded-full" style={{ background: "var(--border)" }}>
                <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: s.color }} />
              </div>
              <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>{pct}% of total</p>
            </div>
          );
        })}
      </div>

      {/* Form */}
      {showForm && (
        <div className="rounded-[14px] p-5 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <h2 className="text-base font-semibold mb-4" style={{ color: "var(--text-primary)" }}>{editing ? "Edit Expense" : "New Expense"}</h2>
          <form onSubmit={handleSave} className="space-y-4">

            {/* Category buttons */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide mb-2 block" style={{ color: "var(--text-faint)" }}>Category</label>
              <div className="flex flex-wrap gap-2">
                {ALL_CATEGORIES.map((cat) => {
                  const s = CATEGORY_STYLE[cat];
                  const active = formCat === cat;
                  return (
                    <button key={cat} type="button" onClick={() => setFormCat(cat)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        background: active ? s.bg : "var(--bg-raised)",
                        color: active ? s.color : "var(--text-muted)",
                        border: `1px solid ${active ? s.color : "var(--border)"}`,
                      }}>
                      {CATEGORY_ICON[cat]} {CATEGORY_LABELS[cat]}
                    </button>
                  );
                })}
              </div>
            </div>

            <input type="date" required value={isUnit(formCat) ? unitForm.date : directForm.date}
              onChange={(e) => isUnit(formCat) ? setUnitForm({ ...unitForm, date: e.target.value }) : setDirectForm({ ...directForm, date: e.target.value })}
              className={inputCls} style={inputStyle} />

            {isUnit(formCat) ? (
              <>
                <input placeholder="Item name (e.g. Chicken Pellets) *" required value={unitForm.name}
                  onChange={(e) => setUnitForm({ ...unitForm, name: e.target.value })} className={inputCls} style={inputStyle} />
                <div className="grid grid-cols-3 gap-3">
                  <input type="number" placeholder="Quantity *" required value={unitForm.quantity} min={0} step="any"
                    onChange={(e) => setUnitForm({ ...unitForm, quantity: e.target.value })} className={inputCls} style={inputStyle} />
                  <input placeholder="Unit (bag, kg…)" value={unitForm.unit}
                    onChange={(e) => setUnitForm({ ...unitForm, unit: e.target.value })} className={inputCls} style={inputStyle} />
                  <input type="number" placeholder="Price / unit *" required value={unitForm.pricePerUnit} min={0} step="any"
                    onChange={(e) => setUnitForm({ ...unitForm, pricePerUnit: e.target.value })} className={inputCls} style={inputStyle} />
                </div>
                {unitForm.quantity && unitForm.pricePerUnit && (
                  <div className="flex items-center justify-between rounded-lg px-4 py-2.5"
                    style={{ background: "var(--danger)10", border: "1px solid var(--danger)30" }}>
                    <span className="text-xs" style={{ color: "var(--text-faint)" }}>Computed total</span>
                    <span className="text-sm font-mono font-bold" style={{ color: "var(--danger)" }}>
                      {fmt(parseFloat(unitForm.quantity) * parseFloat(unitForm.pricePerUnit))}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <>
                <input placeholder="Description *" required value={directForm.description}
                  onChange={(e) => setDirectForm({ ...directForm, description: e.target.value })} className={inputCls} style={inputStyle} />
                <input type="number" placeholder="Amount *" required value={directForm.amount} min={0} step="any"
                  onChange={(e) => setDirectForm({ ...directForm, amount: e.target.value })} className={inputCls} style={inputStyle} />
              </>
            )}

            <input placeholder="Notes (optional)" value={isUnit(formCat) ? unitForm.notes : directForm.notes}
              onChange={(e) => isUnit(formCat) ? setUnitForm({ ...unitForm, notes: e.target.value }) : setDirectForm({ ...directForm, notes: e.target.value })}
              className={inputCls} style={inputStyle} />

            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowForm(false); setEditing(null); }}
                className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions table */}
      {loading ? (
        <div className="space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-14 rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />)}</div>
      ) : expenses.length === 0 ? (
        <div className="rounded-[14px] py-20 text-center" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
          <p style={{ color: "var(--text-faint)" }}>No expenses for {MONTHS[month - 1]} {year}</p>
        </div>
      ) : (
        <>
        {/* Desktop table */}
        <div className="hidden md:block rounded-[14px] overflow-hidden" style={{ border: "1px solid var(--border)" }}>
          <div className="grid text-[11px] font-semibold uppercase tracking-widest px-5 py-3"
            style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)", color: "var(--text-faint)", gridTemplateColumns: "90px 130px 1fr 160px 110px 56px" }}>
            <span>Date</span><span>Category</span><span>Item / Description</span>
            <span>Qty × Price</span><span className="text-right">Total</span><span />
          </div>
          {expenses.map((exp, i) => (
            <div key={exp._id} className="grid items-center px-5 py-3.5 transition-colors"
              style={{ gridTemplateColumns: "90px 130px 1fr 160px 110px 56px", background: i % 2 === 0 ? "var(--bg-base)" : "var(--bg-surface)", borderBottom: i < expenses.length - 1 ? "1px solid var(--border)" : "none" }}>
              <span className="text-xs font-mono" style={{ color: "var(--text-faint)" }}>
                {new Date(exp.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
              </span>
              <span><CategoryPill cat={exp.category} /></span>
              <div>
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{exp.type === "unit" ? exp.name : exp.description}</p>
                {exp.notes && <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{exp.notes}</p>}
              </div>
              <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                {exp.type === "unit" && exp.quantity != null ? `${exp.quantity} ${exp.unit ?? ""} × ${fmt(exp.pricePerUnit)}` : "—"}
              </span>
              <span className="text-sm font-mono font-bold text-right" style={{ color: "var(--danger)" }}>{fmt(exp.effectiveAmount)}</span>
              <div className="flex gap-1.5 justify-end">
                {!exp.locked && (<>
                  <button onClick={() => openEdit(exp)} className="p-1.5 rounded-lg" style={{ color: "var(--accent)", background: "var(--accent)10" }}><Pencil size={13} /></button>
                  <button onClick={() => handleDelete(exp._id)} className="p-1.5 rounded-lg" style={{ color: "var(--danger)", background: "var(--danger)10" }}><Trash2 size={13} /></button>
                </>)}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {expenses.map((exp) => (
            <div key={exp._id} className="rounded-[12px] p-4" style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}>
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1 mr-3">
                  <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                    {exp.type === "unit" ? exp.name : exp.description}
                  </p>
                  {exp.notes && <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{exp.notes}</p>}
                </div>
                <span className="text-base font-bold font-mono" style={{ color: "var(--danger)" }}>{fmt(exp.effectiveAmount)}</span>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <CategoryPill cat={exp.category} />
                <span className="text-xs font-mono" style={{ color: "var(--text-faint)" }}>
                  {new Date(exp.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                {exp.type === "unit" && exp.quantity != null && (
                  <span className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                    {exp.quantity} {exp.unit ?? ""} × {fmt(exp.pricePerUnit)}
                  </span>
                )}
              </div>
              {!exp.locked && (
                <div className="flex gap-2 mt-3 pt-3 border-t" style={{ borderColor: "var(--border)" }}>
                  <button onClick={() => openEdit(exp)} className="flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--accent)", border: "1px solid var(--accent)40" }}>Edit</button>
                  <button onClick={() => handleDelete(exp._id)} className="flex-1 py-1.5 rounded-lg text-xs font-medium" style={{ color: "var(--danger)", border: "1px solid var(--danger)40" }}>Delete</button>
                </div>
              )}
            </div>
          ))}
        </div>
        </>
      )}
    </div>
  );
}
