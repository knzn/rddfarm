"use client";

import { useEffect, useState } from "react";
import { Plus, Trash2, ChevronDown, ChevronUp, User, CalendarDays, Phone, Link2 } from "lucide-react";

interface Advance { _id: string; amount: number; reason?: string; date: string; month: number; year: number }
interface Payment { _id?: string; month: number; year: number; grossSalary: number; totalAdvances: number; netPay: number; paidAt: string }
interface Worker {
  _id: string; name: string; position: string; monthlySalary: number; salaryDay: number;
  photo?: string; address?: string; phoneNumber?: string; fbLink?: string;
  advances: Advance[]; payments: Payment[];
}

const POSITIONS = ["Farm Manager", "Handler", "Assistant Handler", "Breeder", "Assistant Breeder", "Farm Buddy"];
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const FULL_MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

// Color per position — maps to design palette
const POSITION_COLOR: Record<string, string> = {
  "Farm Manager":       "var(--accent)",
  "Handler":            "var(--success)",
  "Assistant Handler":  "#06b6d4",
  "Breeder":            "var(--warning)",
  "Assistant Breeder":  "#a78bfa",
  "Farm Buddy":         "var(--text-muted)",
};
function posColor(pos: string) { return POSITION_COLOR[pos] ?? "var(--accent)"; }

function fmt(n: number | null | undefined) { return `₱${(n ?? 0).toLocaleString()}`; }

const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
const inputCls = "rounded-lg px-3 py-2 text-sm outline-none";

export default function WorkersClient() {
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: "", position: "Handler", monthlySalary: "", salaryDay: "30" });
  const [advForm, setAdvForm] = useState<Record<string, { amount: string; reason: string; date: string }>>({});
  const [payForm, setPayForm] = useState<Record<string, { month: string; year: string; grossSalary: string; totalAdvances: string }>>({});
  const [showAdvHistory, setShowAdvHistory] = useState<Record<string, boolean>>({});

  const now = new Date();
  const curMonth = now.getMonth() + 1;
  const curYear = now.getFullYear();

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
    if (!confirm("Delete this worker and all their records?")) return;
    await fetch(`/api/workers/${id}`, { method: "DELETE" }); load();
  }

  async function addAdvance(workerId: string, e: React.FormEvent) {
    e.preventDefault();
    const af = advForm[workerId];
    const d = new Date(af.date);
    await fetch(`/api/workers/${workerId}/advances`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: +af.amount, reason: af.reason, date: af.date, month: d.getMonth() + 1, year: d.getFullYear() }),
    });
    setAdvForm((prev) => ({ ...prev, [workerId]: { amount: "", reason: "", date: now.toISOString().slice(0, 10) } }));
    load();
  }

  async function deleteAdvance(workerId: string, advId: string) {
    await fetch(`/api/workers/${workerId}/advances/${advId}`, { method: "DELETE" }); load();
  }

  async function recordPayment(workerId: string, e: React.FormEvent) {
    e.preventDefault();
    const pf = payForm[workerId];
    const netPay = +pf.grossSalary - +pf.totalAdvances;
    await fetch(`/api/workers/${workerId}/payments`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ month: +pf.month, year: +pf.year, grossSalary: +pf.grossSalary, totalAdvances: +pf.totalAdvances, netPay }),
    });
    setPayForm((prev) => ({ ...prev, [workerId]: { month: String(curMonth), year: String(curYear), grossSalary: "", totalAdvances: "0" } }));
    load();
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Workers</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{workers.length} staff member{workers.length !== 1 ? "s" : ""}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
          <Plus size={15} /> Add Worker
        </button>
      </div>

      {/* Add Worker Form */}
      {showAdd && (
        <div className="rounded-[12px] p-5 mb-6 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <p className="text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>New Worker</p>
          <form onSubmit={addWorker} className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input placeholder="Full Name *" required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className={`${inputCls} w-full`} style={inputStyle} />
            <select value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} className={`${inputCls} w-full`} style={inputStyle}>
              {POSITIONS.map((p) => <option key={p}>{p}</option>)}
            </select>
            <input type="number" placeholder="Monthly Salary *" required value={form.monthlySalary} onChange={(e) => setForm({ ...form, monthlySalary: e.target.value })} className={`${inputCls} w-full`} style={inputStyle} />
            <input type="number" placeholder="Salary Day (1–31, default 30)" value={form.salaryDay} onChange={(e) => setForm({ ...form, salaryDay: e.target.value })} className={`${inputCls} w-full`} style={inputStyle} />
            <div className="sm:col-span-2 flex gap-2 justify-end">
              <button type="button" onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg text-sm" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
              <button type="submit" className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "var(--accent)", color: "#fff" }}>Save</button>
            </div>
          </form>
        </div>
      )}

      {/* Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />
          ))}
        </div>
      ) : workers.length === 0 ? (
        <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>No workers yet. Add your first staff member.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {workers.map((w) => {
            const color = posColor(w.position);
            const isOpen = expanded === w._id;

            const thisMonthAdvances = w.advances.filter((a) => a.month === curMonth && a.year === curYear);
            const thisMonthAdvTotal = thisMonthAdvances.reduce((s, a) => s + a.amount, 0);
            const netThisMonth = w.monthlySalary - thisMonthAdvTotal;

            const lastPayment = w.payments.length > 0 ? w.payments[w.payments.length - 1] : null;

            if (!advForm[w._id]) advForm[w._id] = { amount: "", reason: "", date: now.toISOString().slice(0, 10) };
            if (!payForm[w._id]) payForm[w._id] = { month: String(curMonth), year: String(curYear), grossSalary: String(w.monthlySalary), totalAdvances: String(thisMonthAdvTotal) };

            return (
              <div key={w._id} className="rounded-[12px] overflow-hidden flex flex-col"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderTop: `3px solid ${color}` }}>

                {/* Card face */}
                <div className="p-5 flex flex-col flex-1">

                  {/* Top row — position label + actions */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>
                      {w.position}
                    </span>
                    <div className="flex gap-1.5">
                      <button onClick={() => deleteWorker(w._id)} className="p-1.5 rounded-lg hover:opacity-70" style={{ color: "var(--danger)" }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Name */}
                  <p className="text-2xl font-bold leading-tight mb-4" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
                    {w.name}
                  </p>

                  {/* KPI row */}
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    <div className="rounded-lg px-3 py-2 text-center" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                      <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--text-faint)" }}>Salary</p>
                      <p className="text-sm font-bold font-mono" style={{ color: "var(--text-primary)" }}>{fmt(w.monthlySalary)}</p>
                    </div>
                    <div className="rounded-lg px-3 py-2 text-center" style={{ background: "var(--bg-raised)", border: `1px solid ${thisMonthAdvTotal > 0 ? "var(--warning)" : "var(--border)"}` }}>
                      <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--text-faint)" }}>Advances</p>
                      <p className="text-sm font-bold font-mono" style={{ color: thisMonthAdvTotal > 0 ? "var(--warning)" : "var(--text-muted)" }}>{fmt(thisMonthAdvTotal)}</p>
                    </div>
                    <div className="rounded-lg px-3 py-2 text-center" style={{ background: "var(--bg-raised)", border: `1px solid ${netThisMonth < w.monthlySalary ? "var(--success)" : "var(--border)"}` }}>
                      <p className="text-[10px] uppercase tracking-wide mb-0.5" style={{ color: "var(--text-faint)" }}>Net Pay</p>
                      <p className="text-sm font-bold font-mono" style={{ color: "var(--success)" }}>{fmt(netThisMonth)}</p>
                    </div>
                  </div>

                  {/* Contact + salary day row */}
                  <div className="space-y-1.5 mb-4">
                    <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <CalendarDays size={12} style={{ color }} />
                      <span>Salary day: <strong style={{ color: "var(--text-primary)" }}>{w.salaryDay}</strong> of every month</span>
                    </div>
                    {w.phoneNumber && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Phone size={12} style={{ color }} />
                        <span>{w.phoneNumber}</span>
                      </div>
                    )}
                    {w.fbLink && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <Link2 size={12} style={{ color }} />
                        <span>{w.fbLink}</span>
                      </div>
                    )}
                    {w.address && (
                      <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                        <User size={12} style={{ color }} />
                        <span>{w.address}</span>
                      </div>
                    )}
                  </div>

                  {/* Advances list — current month only, with history toggle */}
                  {(() => {
                    const prevAdvances = w.advances.filter((a) => !(a.month === curMonth && a.year === curYear));
                    const showHistory = showAdvHistory[w._id];
                    const displayed = showHistory ? [...w.advances].reverse() : [...thisMonthAdvances].reverse();
                    if (w.advances.length === 0) return null;
                    return (
                      <div className="mb-4 rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
                        <div className="flex items-center justify-between px-3 py-2" style={{ background: "var(--bg-raised)", borderBottom: "1px solid var(--border)" }}>
                          <span className="text-[10px] font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                            Advances {showHistory ? "(All)" : `— ${MONTHS[curMonth - 1]} ${curYear}`}
                          </span>
                          <span className="text-[10px] font-mono" style={{ color: "var(--warning)" }}>
                            {fmt((showHistory ? w.advances : thisMonthAdvances).reduce((s, a) => s + a.amount, 0))}
                          </span>
                        </div>
                        {displayed.length > 0 ? (
                          <div className="divide-y divide-[var(--border)]">
                            {displayed.map((a) => (
                              <div key={a._id} className="flex items-center justify-between px-3 py-2" style={{ background: "var(--bg-surface)" }}>
                                <div>
                                  <span className="text-xs font-mono font-semibold" style={{ color: "var(--warning)" }}>{fmt(a.amount)}</span>
                                  {a.reason && <span className="text-[11px] ml-2" style={{ color: "var(--text-muted)" }}>{a.reason}</span>}
                                </div>
                                <span className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                                  {new Date(a.date).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[11px] px-3 py-2" style={{ color: "var(--text-faint)" }}>No advances this month</p>
                        )}
                        {prevAdvances.length > 0 && (
                          <button
                            onClick={() => setShowAdvHistory((p) => ({ ...p, [w._id]: !p[w._id] }))}
                            className="w-full text-[11px] py-1.5 text-center transition-all"
                            style={{ borderTop: "1px solid var(--border)", color: showHistory ? "var(--danger)" : "var(--accent)", background: "var(--bg-raised)" }}>
                            {showHistory ? "Hide history" : `Show history (${prevAdvances.length} previous)`}
                          </button>
                        )}
                      </div>
                    );
                  })()}

                  {/* Last payment badge */}
                  {lastPayment ? (
                    <div className="rounded-lg px-3 py-2 flex items-center justify-between mb-4" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                      <span className="text-xs" style={{ color: "var(--text-faint)" }}>Last paid: {MONTHS[lastPayment.month - 1]} {lastPayment.year}</span>
                      <span className="text-xs font-mono font-semibold" style={{ color: "var(--success)" }}>Net {fmt(lastPayment.netPay)}</span>
                    </div>
                  ) : (
                    <div className="rounded-lg px-3 py-2 mb-4 text-xs text-center" style={{ background: "var(--bg-raised)", color: "var(--text-faint)" }}>
                      No payments recorded yet
                    </div>
                  )}

                  {/* Expand toggle */}
                  <button
                    onClick={() => setExpanded(isOpen ? null : w._id)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                    style={{ border: `1px solid ${isOpen ? color : "var(--border)"}`, color: isOpen ? color : "var(--text-muted)", background: "transparent" }}>
                    {isOpen ? <><ChevronUp size={13} /> Hide Details</> : <><ChevronDown size={13} /> Advances & Payments</>}
                  </button>
                </div>

                {/* Expandable section */}
                {isOpen && (
                  <div className="border-t px-5 pb-5 pt-4 space-y-5" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>

                    {/* This month's advances */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>
                          Advances — {FULL_MONTHS[curMonth - 1]} {curYear}
                        </p>
                        {thisMonthAdvTotal > 0 && (
                          <span className="text-xs font-mono px-2 py-0.5 rounded-full" style={{ background: "var(--warning)20", color: "var(--warning)" }}>
                            {fmt(thisMonthAdvTotal)}
                          </span>
                        )}
                      </div>

                      {thisMonthAdvances.length > 0 ? (
                        <div className="space-y-1 mb-3">
                          {thisMonthAdvances.map((a) => (
                            <div key={a._id} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--bg-surface)" }}>
                              <div>
                                <p className="text-sm" style={{ color: "var(--text-primary)" }}>{fmt(a.amount)}</p>
                                <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>{new Date(a.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}{a.reason ? ` — ${a.reason}` : ""}</p>
                              </div>
                              <button onClick={() => deleteAdvance(w._id, a._id)} className="p-1.5 rounded hover:opacity-70" style={{ color: "var(--danger)" }}>
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>No advances this month</p>
                      )}

                      {/* Add advance form */}
                      <form onSubmit={(e) => addAdvance(w._id, e)} className="grid grid-cols-2 gap-2">
                        <input type="number" placeholder="Amount *" required value={advForm[w._id]?.amount ?? ""} onChange={(e) => setAdvForm((p) => ({ ...p, [w._id]: { ...p[w._id], amount: e.target.value } }))} className={`${inputCls} w-full`} style={inputStyle} />
                        <input type="date" required value={advForm[w._id]?.date ?? ""} onChange={(e) => setAdvForm((p) => ({ ...p, [w._id]: { ...p[w._id], date: e.target.value } }))} className={`${inputCls} w-full`} style={inputStyle} />
                        <input placeholder="Reason (optional)" value={advForm[w._id]?.reason ?? ""} onChange={(e) => setAdvForm((p) => ({ ...p, [w._id]: { ...p[w._id], reason: e.target.value } }))} className={`${inputCls} w-full col-span-2`} style={inputStyle} />
                        <button type="submit" className="col-span-2 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--warning)", color: "#000" }}>
                          + Record Advance
                        </button>
                      </form>
                    </div>

                    {/* Payment history */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>Payment History</p>
                      {w.payments.length > 0 ? (
                        <div className="space-y-1 mb-3">
                          {[...w.payments].reverse().slice(0, 5).map((p, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg px-3 py-2" style={{ background: "var(--bg-surface)" }}>
                              <div>
                                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{FULL_MONTHS[p.month - 1]} {p.year}</p>
                                <p className="text-[11px]" style={{ color: "var(--text-faint)" }}>
                                  Gross {fmt(p.grossSalary)} — Advances {fmt(p.totalAdvances)}
                                </p>
                              </div>
                              <span className="text-sm font-bold font-mono" style={{ color: "var(--success)" }}>{fmt(p.netPay)}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs mb-3" style={{ color: "var(--text-faint)" }}>No payments yet</p>
                      )}

                      {/* Record payment form */}
                      <p className="text-[11px] font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-faint)" }}>Record Payment</p>
                      <form onSubmit={(e) => recordPayment(w._id, e)} className="grid grid-cols-2 gap-2">
                        <select value={payForm[w._id]?.month ?? ""} onChange={(e) => setPayForm((p) => ({ ...p, [w._id]: { ...p[w._id], month: e.target.value } }))} className={`${inputCls} w-full`} style={inputStyle}>
                          {FULL_MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                        <input type="number" placeholder="Year" value={payForm[w._id]?.year ?? ""} onChange={(e) => setPayForm((p) => ({ ...p, [w._id]: { ...p[w._id], year: e.target.value } }))} className={`${inputCls} w-full`} style={inputStyle} />
                        <input type="number" placeholder="Gross salary" value={payForm[w._id]?.grossSalary ?? ""} onChange={(e) => setPayForm((p) => ({ ...p, [w._id]: { ...p[w._id], grossSalary: e.target.value } }))} className={`${inputCls} w-full`} style={inputStyle} />
                        <input type="number" placeholder="Advances deducted" value={payForm[w._id]?.totalAdvances ?? ""} onChange={(e) => setPayForm((p) => ({ ...p, [w._id]: { ...p[w._id], totalAdvances: e.target.value } }))} className={`${inputCls} w-full`} style={inputStyle} />
                        {payForm[w._id]?.grossSalary && (
                          <div className="col-span-2 rounded-lg px-3 py-2 flex justify-between text-sm" style={{ background: "var(--bg-surface)" }}>
                            <span style={{ color: "var(--text-muted)" }}>Net Pay</span>
                            <span className="font-bold font-mono" style={{ color: "var(--success)" }}>
                              {fmt(+( payForm[w._id]?.grossSalary ?? 0) - +(payForm[w._id]?.totalAdvances ?? 0))}
                            </span>
                          </div>
                        )}
                        <button type="submit" className="col-span-2 py-2 rounded-lg text-xs font-medium" style={{ background: "var(--success)", color: "#fff" }}>
                          ✓ Record Payment
                        </button>
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
