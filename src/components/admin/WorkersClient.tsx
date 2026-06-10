"use client";

import { useEffect, useState } from "react";
import { Plus, ChevronDown, ChevronUp, Trash2 } from "lucide-react";

interface Advance { _id: string; amount: number; reason?: string; date: string }
interface Payment { month: number; year: number; grossSalary: number; totalAdvances: number; netPay: number; paidAt: string }
interface Worker {
  _id: string; name: string; position: string; monthlySalary: number; salaryDay: number;
  photo?: string; address?: string; phoneNumber?: string; fbLink?: string;
  advances: Advance[]; payments: Payment[];
}

const POSITIONS = ["Farm Manager", "Handler", "Assistant Handler", "Breeder", "Assistant Breeder", "Farm Buddy"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmt(n: number | null | undefined) { return `₱${(n ?? 0).toLocaleString()}`; }

const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const inputCls = "w-full rounded-lg px-3 py-2 text-sm outline-none";

export default function WorkersClient() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", position: "Handler", monthlySalary: "", salaryDay: "30" });
  const [advForm, setAdvForm] = useState<Record<string, { amount: string; reason: string; date: string }>>({});
  const [payForm, setPayForm] = useState<Record<string, { month: string; year: string; grossSalary: string; totalAdvances: string }>>({});

  async function load() {
    setLoading(true);
    const r = await fetch("/api/workers");
    const j = await r.json();
    setWorkers(j.data ?? []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function addWorker(e: React.FormEvent) {
    e.preventDefault();
    await fetch("/api/workers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, monthlySalary: +form.monthlySalary, salaryDay: +form.salaryDay }) });
    setShowAdd(false); setForm({ name: "", position: "Handler", monthlySalary: "", salaryDay: "30" }); load();
  }

  async function deleteWorker(id: string) {
    if (!confirm("Delete this worker?")) return;
    await fetch(`/api/workers/${id}`, { method: "DELETE" }); load();
  }

  async function addAdvance(workerId: string, e: React.FormEvent) {
    e.preventDefault();
    const af = advForm[workerId];
    await fetch(`/api/workers/${workerId}/advances`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: +af.amount, reason: af.reason, date: af.date }) });
    setAdvForm((prev) => ({ ...prev, [workerId]: { amount: "", reason: "", date: new Date().toISOString().slice(0, 10) } }));
    load();
  }

  async function deleteAdvance(workerId: string, advId: string) {
    await fetch(`/api/workers/${workerId}/advances/${advId}`, { method: "DELETE" }); load();
  }

  async function recordPayment(workerId: string, e: React.FormEvent) {
    e.preventDefault();
    const pf = payForm[workerId];
    const netPay = +pf.grossSalary - +pf.totalAdvances;
    await fetch(`/api/workers/${workerId}/payments`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ month: +pf.month, year: +pf.year, grossSalary: +pf.grossSalary, totalAdvances: +pf.totalAdvances, netPay }) });
    setPayForm((prev) => ({ ...prev, [workerId]: { month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), grossSalary: "", totalAdvances: "0" } }));
    load();
  }

  const now = new Date();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Workers</h1>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
          <Plus size={15} /> Add Worker
        </button>
      </div>

      {showAdd && (
        <div className="rounded-[12px] p-5 mb-6 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <h2 className="font-semibold mb-4" style={{ color: "var(--text-primary)" }}>New Worker</h2>
          <form onSubmit={addWorker} className="grid grid-cols-2 gap-3">
            <input placeholder="Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputCls} style={inputStyle} />
            <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={inputCls} style={inputStyle}>
              {POSITIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <input type="number" placeholder="Monthly Salary *" required value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} className={inputCls} style={inputStyle} />
            <input type="number" placeholder="Salary Day (1–31)" value={form.salaryDay} onChange={(e) => setForm({ ...form, salaryDay: e.target.value })} className={inputCls} style={inputStyle} />
            <div className="col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-20 rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />)}</div>
      ) : workers.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>No workers yet</div>
      ) : (
        <div className="space-y-3">
          {workers.map((w) => {
            const isOpen = expanded === w._id;
            const totalAdvances = w.advances.reduce((s, a) => s + a.amount, 0);
            if (!advForm[w._id]) advForm[w._id] = { amount: "", reason: "", date: now.toISOString().slice(0, 10) };
            if (!payForm[w._id]) payForm[w._id] = { month: String(now.getMonth() + 1), year: String(now.getFullYear()), grossSalary: String(w.monthlySalary), totalAdvances: String(totalAdvances) };

            return (
              <div key={w._id} className="rounded-[12px] border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
                <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : w._id)}>
                  <div>
                    <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{w.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{w.position} · {fmt(w.monthlySalary)}/mo · Salary day {w.salaryDay}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {totalAdvances > 0 && <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: "var(--warning)20", color: "var(--warning)" }}>Advances: {fmt(totalAdvances)}</span>}
                    <button onClick={(e) => { e.stopPropagation(); deleteWorker(w._id); }} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }}><Trash2 size={14} /></button>
                    {isOpen ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}
                  </div>
                </div>

                {isOpen && (
                  <div className="px-5 pb-5 border-t space-y-5" style={{ borderColor: "var(--border)" }}>
                    {/* Advances */}
                    <div className="pt-4">
                      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-faint)" }}>Advances</p>
                      {w.advances.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {w.advances.map((a) => (
                            <div key={a._id} className="flex items-center justify-between text-sm">
                              <span style={{ color: "var(--text-muted)" }}>{new Date(a.date).toLocaleDateString()} — {a.reason || "No reason"}</span>
                              <div className="flex items-center gap-2">
                                <span className="font-mono" style={{ color: "var(--warning)" }}>{fmt(a.amount)}</span>
                                <button onClick={() => deleteAdvance(w._id, a._id)} className="p-1 hover:opacity-70" style={{ color: "var(--danger)" }}><Trash2 size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                      <form onSubmit={(e) => addAdvance(w._id, e)} className="flex gap-2 flex-wrap">
                        <input type="number" placeholder="Amount *" required value={advForm[w._id]?.amount ?? ""} onChange={(e) => setAdvForm((p) => ({ ...p, [w._id]: { ...p[w._id], amount: e.target.value } }))} className="rounded-lg px-3 py-1.5 text-sm outline-none" style={{ ...inputStyle, width: 120 }} />
                        <input placeholder="Reason" value={advForm[w._id]?.reason ?? ""} onChange={(e) => setAdvForm((p) => ({ ...p, [w._id]: { ...p[w._id], reason: e.target.value } }))} className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none" style={inputStyle} />
                        <input type="date" required value={advForm[w._id]?.date ?? ""} onChange={(e) => setAdvForm((p) => ({ ...p, [w._id]: { ...p[w._id], date: e.target.value } }))} className="rounded-lg px-3 py-1.5 text-sm outline-none" style={{ ...inputStyle, width: 140 }} />
                        <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Add</button>
                      </form>
                    </div>

                    {/* Record Payment */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-faint)" }}>Record Payment</p>
                      {w.payments.length > 0 && (
                        <div className="space-y-1 mb-3">
                          {w.payments.slice(-3).map((p, i) => (
                            <div key={i} className="flex justify-between text-xs" style={{ color: "var(--text-muted)" }}>
                              <span>{MONTHS[p.month - 1]} {p.year}</span>
                              <span className="font-mono" style={{ color: "var(--success)" }}>Net: {fmt(p.netPay)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                      <form onSubmit={(e) => recordPayment(w._id, e)} className="flex gap-2 flex-wrap">
                        <select value={payForm[w._id]?.month ?? ""} onChange={(e) => setPayForm((p) => ({ ...p, [w._id]: { ...p[w._id], month: e.target.value } }))} className="rounded-lg px-3 py-1.5 text-sm outline-none" style={{ ...inputStyle, width: 100 }}>
                          {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <input type="number" placeholder="Year" value={payForm[w._id]?.year ?? ""} onChange={(e) => setPayForm((p) => ({ ...p, [w._id]: { ...p[w._id], year: e.target.value } }))} className="rounded-lg px-3 py-1.5 text-sm outline-none" style={{ ...inputStyle, width: 80 }} />
                        <input type="number" placeholder="Gross salary" value={payForm[w._id]?.grossSalary ?? ""} onChange={(e) => setPayForm((p) => ({ ...p, [w._id]: { ...p[w._id], grossSalary: e.target.value } }))} className="rounded-lg px-3 py-1.5 text-sm outline-none" style={{ ...inputStyle, width: 130 }} />
                        <input type="number" placeholder="Total advances" value={payForm[w._id]?.totalAdvances ?? ""} onChange={(e) => setPayForm((p) => ({ ...p, [w._id]: { ...p[w._id], totalAdvances: e.target.value } }))} className="rounded-lg px-3 py-1.5 text-sm outline-none" style={{ ...inputStyle, width: 130 }} />
                        <button type="submit" className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--success)", color: "#fff" }}>Record</button>
                      </form>
                    </div>
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
