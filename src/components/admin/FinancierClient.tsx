"use client";

import { useState, useEffect, useRef } from "react";
import { Plus, Trash2, Camera, ChevronDown } from "lucide-react";

interface Transaction {
  _id: string;
  type: "advance" | "payment";
  date: string;
  amount: number;
  chickenType: string | null;
  volume: number | null;
  priceEach: number | null;
  notes: string | null;
  createdAt: string;
}

interface Financier {
  _id: string;
  name: string;
  transactions: Transaction[];
}

const inputStyle: React.CSSProperties = {
  background: "var(--bg-raised)",
  border: "1px solid var(--border)",
  borderRadius: 8,
  color: "var(--text-primary)",
  padding: "8px 12px",
  fontSize: 13,
  width: "100%",
  outline: "none",
};

const CHICKEN_TYPES = ["Stag", "Cock", "Pullet", "Hen"];

function fmt(n: number) {
  return "₱" + Math.abs(n).toLocaleString("en-PH");
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric" });
}

function calcBalance(transactions: Transaction[]) {
  let totalAdvance = 0;
  let totalPaid = 0;
  for (const t of transactions) {
    if (t.type === "advance") totalAdvance += t.amount;
    else totalPaid += t.amount;
  }
  return { totalAdvance, totalPaid, balance: totalPaid - totalAdvance };
}

// ── Summary cards ─────────────────────────────────────────────────────────────
function SummaryCards({ transactions, ledgerRef }: { transactions: Transaction[]; ledgerRef: React.RefObject<HTMLDivElement | null> }) {
  const { totalAdvance, totalPaid, balance } = calcBalance(transactions);
  const isPositive = balance >= 0;

  async function savePhoto() {
    if (!ledgerRef.current) return;
    const html2canvas = (await import("html2canvas")).default;
    const canvas = await html2canvas(ledgerRef.current, {
      backgroundColor: "#0D1117",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `financier-ledger.png`;
    a.click();
  }

  return (
    <div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12, marginBottom: 16 }}>
        <div style={{ background: "var(--bg-raised)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Advance</p>
          <p style={{ fontSize: 22, fontWeight: 500, color: "var(--danger)", margin: 0, fontFamily: "var(--font-mono)" }}>{fmt(totalAdvance)}</p>
          <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "4px 0 0" }}>They gave us</p>
        </div>
        <div style={{ background: "var(--bg-raised)", borderRadius: 10, padding: "14px 16px", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Total Paid</p>
          <p style={{ fontSize: 22, fontWeight: 500, color: "var(--success)", margin: 0, fontFamily: "var(--font-mono)" }}>{fmt(totalPaid)}</p>
          <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "4px 0 0" }}>We paid (chickens)</p>
        </div>
        <div style={{ background: "var(--bg-raised)", borderRadius: 10, padding: "14px 16px", border: `1px solid ${isPositive ? "var(--success)" : "var(--danger)"}40` }}>
          <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "0 0 6px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Balance</p>
          <p style={{ fontSize: 22, fontWeight: 500, color: isPositive ? "var(--success)" : "var(--danger)", margin: 0, fontFamily: "var(--font-mono)" }}>
            {isPositive ? "+" : "-"}{fmt(balance)}
          </p>
          <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "4px 0 0" }}>{isPositive ? "They owe us" : "We owe them"}</p>
        </div>
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <button onClick={savePhoto}
          style={{ ...inputStyle, width: "auto", display: "flex", alignItems: "center", gap: 6, padding: "7px 14px", cursor: "pointer", color: "var(--text-muted)", fontSize: 12 }}>
          <Camera size={14} /> Save as Photo
        </button>
      </div>
    </div>
  );
}

// ── Add transaction form ───────────────────────────────────────────────────────
function AddTransactionForm({ financierId, onAdded }: { financierId: string; onAdded: (f: Financier) => void }) {
  const [type, setType] = useState<"advance" | "payment">("advance");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [amount, setAmount] = useState("");
  const [chickenType, setChickenType] = useState("Stag");
  const [volume, setVolume] = useState("");
  const [priceEach, setPriceEach] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const total = type === "payment" && volume && priceEach
    ? Number(volume) * Number(priceEach)
    : null;

  async function submit() {
    if (type === "advance" && !amount) return;
    if (type === "payment" && (!volume || !priceEach)) return;
    setSaving(true);
    const r = await fetch(`/api/financiers/${financierId}/transactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, date, amount, chickenType, volume, priceEach, notes }),
    });
    const j = await r.json();
    if (j.data) {
      onAdded(j.data);
      setAmount(""); setVolume(""); setPriceEach(""); setNotes("");
    }
    setSaving(false);
  }

  return (
    <div style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "16px 18px", marginBottom: 20 }}>
      <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: "0 0 12px" }}>New transaction</p>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>Type</p>
          <select value={type} onChange={(e) => setType(e.target.value as "advance" | "payment")} style={inputStyle}>
            <option value="advance">Advance — they give us money</option>
            <option value="payment">Payment — we pay with chickens</option>
          </select>
        </div>
        <div>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>Date</p>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>
      </div>

      {type === "advance" ? (
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>Amount (₱)</p>
          <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 100000" style={inputStyle} />
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10, marginBottom: 10 }}>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>Chicken type</p>
            <select value={chickenType} onChange={(e) => setChickenType(e.target.value)} style={inputStyle}>
              {CHICKEN_TYPES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>Volume</p>
            <input type="number" value={volume} onChange={(e) => setVolume(e.target.value)} placeholder="17" style={inputStyle} />
          </div>
          <div>
            <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>Price each (₱)</p>
            <input type="number" value={priceEach} onChange={(e) => setPriceEach(e.target.value)} placeholder="4000" style={inputStyle} />
          </div>
        </div>
      )}

      {total !== null && (
        <p style={{ fontSize: 13, color: "var(--success)", margin: "0 0 10px", fontFamily: "var(--font-mono)" }}>
          Total: ₱{total.toLocaleString("en-PH")}
        </p>
      )}

      <div style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 11, color: "var(--text-muted)", margin: "0 0 4px" }}>Notes (optional)</p>
        <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any note..." style={inputStyle} />
      </div>

      <button onClick={submit} disabled={saving}
        style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "9px 20px", fontSize: 13, fontWeight: 500, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
        {saving ? "Adding…" : "Add entry"}
      </button>
    </div>
  );
}

// ── Ledger list ───────────────────────────────────────────────────────────────
function LedgerList({ financier, onDelete }: { financier: Financier; onDelete: (txId: string) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      {financier.transactions.length === 0 && (
        <p style={{ fontSize: 13, color: "var(--text-faint)", textAlign: "center", padding: "24px 0" }}>No transactions yet.</p>
      )}
      {financier.transactions.map((tx) => {
        const isAdvance = tx.type === "advance";
        const borderColor = isAdvance ? "var(--danger)" : "var(--success)";
        const amountColor = isAdvance ? "var(--danger)" : "var(--success)";
        const sign = isAdvance ? "-" : "+";

        const label = isAdvance
          ? `${financier.name} gave ₱${tx.amount.toLocaleString("en-PH")}`
          : `RDD → ${tx.volume} ${tx.chickenType}${Number(tx.volume) > 1 ? "s" : ""} × ₱${tx.priceEach?.toLocaleString("en-PH")}`;

        return (
          <div key={tx._id}
            style={{ background: "var(--bg-surface)", border: "1px solid var(--border)", borderLeft: `3px solid ${borderColor}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1, minWidth: 0 }}>
              <div style={{ background: isAdvance ? "var(--danger)15" : "var(--success)15", borderRadius: 6, padding: "5px 10px", fontSize: 11, fontWeight: 500, color: borderColor, flexShrink: 0 }}>
                {isAdvance ? "ADVANCE" : "PAYMENT"}
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: "var(--text-primary)", margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{label}</p>
                <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "2px 0 0" }}>
                  {fmtDate(tx.date)}{tx.notes ? ` · ${tx.notes}` : ""}
                </p>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: amountColor, margin: 0, fontFamily: "var(--font-mono)" }}>
                {sign}₱{tx.amount.toLocaleString("en-PH")}
              </p>
              <button onClick={() => onDelete(tx._id)}
                style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--text-faint)", padding: 4, borderRadius: 6 }}
                title="Delete">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main client ───────────────────────────────────────────────────────────────
export default function FinancierClient() {
  const [financiers, setFinanciers] = useState<Financier[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [addingFinancier, setAddingFinancier] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const ledgerRef = useRef<HTMLDivElement>(null);

  async function load() {
    const r = await fetch("/api/financiers");
    const j = await r.json();
    const list: Financier[] = j.data ?? [];
    setFinanciers(list);
    if (list.length && !activeId) setActiveId(list[0]._id);
  }

  useEffect(() => { load(); }, []);

  async function addFinancier() {
    if (!newName.trim()) return;
    setAddingFinancier(true);
    const r = await fetch("/api/financiers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const j = await r.json();
    if (j.data) {
      setFinanciers((prev) => [...prev, j.data]);
      setActiveId(j.data._id);
      setNewName("");
      setShowForm(false);
    }
    setAddingFinancier(false);
  }

  async function deleteFinancier(id: string) {
    if (!window.confirm("Delete this financier and all their transactions?")) return;
    await fetch(`/api/financiers/${id}`, { method: "DELETE" });
    const updated = financiers.filter((f) => f._id !== id);
    setFinanciers(updated);
    setActiveId(updated[0]?._id ?? null);
  }

  async function deleteTx(financierId: string, txId: string) {
    if (!window.confirm("Delete this transaction?")) return;
    const r = await fetch(`/api/financiers/${financierId}/transactions/${txId}`, { method: "DELETE" });
    const j = await r.json();
    if (j.data) setFinanciers((prev) => prev.map((f) => f._id === financierId ? j.data : f));
  }

  function handleAdded(updated: Financier) {
    setFinanciers((prev) => prev.map((f) => f._id === updated._id ? updated : f));
  }

  const active = financiers.find((f) => f._id === activeId) ?? null;

  return (
    <div>
      {/* Financier tabs + add button */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 20 }}>
        {financiers.map((f) => (
          <button key={f._id} onClick={() => setActiveId(f._id)}
            style={{
              padding: "7px 16px", borderRadius: 999, fontSize: 13, fontWeight: 500, cursor: "pointer",
              background: activeId === f._id ? "var(--accent)" : "var(--bg-raised)",
              color: activeId === f._id ? "#fff" : "var(--text-muted)",
              border: activeId === f._id ? "none" : "1px solid var(--border)",
            }}>
            {f.name}
          </button>
        ))}

        {!showForm ? (
          <button onClick={() => setShowForm(true)}
            style={{ padding: "7px 14px", borderRadius: 999, fontSize: 13, cursor: "pointer", background: "transparent", border: "1px dashed var(--border)", color: "var(--text-faint)", display: "flex", alignItems: "center", gap: 6 }}>
            <Plus size={13} /> Add financier
          </button>
        ) : (
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input autoFocus value={newName} onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addFinancier()}
              placeholder="Financier name" style={{ ...inputStyle, width: 160, padding: "6px 10px" }} />
            <button onClick={addFinancier} disabled={addingFinancier}
              style={{ background: "var(--accent)", color: "#fff", border: "none", borderRadius: 8, padding: "6px 14px", fontSize: 13, cursor: "pointer" }}>
              {addingFinancier ? "…" : "Add"}
            </button>
            <button onClick={() => { setShowForm(false); setNewName(""); }}
              style={{ background: "transparent", border: "1px solid var(--border)", borderRadius: 8, padding: "6px 10px", fontSize: 13, cursor: "pointer", color: "var(--text-muted)" }}>
              Cancel
            </button>
          </div>
        )}
      </div>

      {!active && (
        <div style={{ textAlign: "center", padding: "60px 0", color: "var(--text-faint)" }}>
          <p>No financier yet. Add one above.</p>
        </div>
      )}

      {active && (
        <div>
          {/* Financier header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div>
              <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "0 0 2px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Financier</p>
              <p style={{ fontSize: 22, fontWeight: 500, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-heading)" }}>{active.name}</p>
            </div>
            <button onClick={() => deleteFinancier(active._id)}
              style={{ background: "transparent", border: "1px solid var(--danger)40", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "var(--danger)", cursor: "pointer" }}>
              Delete financier
            </button>
          </div>

          {/* Summary cards + photo button */}
          <SummaryCards transactions={active.transactions} ledgerRef={ledgerRef} />

          {/* Add transaction form */}
          <AddTransactionForm financierId={active._id} onAdded={handleAdded} />

          {/* Ledger — captured for photo */}
          <div ref={ledgerRef} style={{ padding: "16px", background: "var(--bg-base)", borderRadius: 12 }}>
            {/* Ledger header shown in photo */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12, paddingBottom: 10, borderBottom: "1px solid var(--border)" }}>
              <p style={{ fontSize: 15, fontWeight: 500, color: "var(--text-primary)", margin: 0, fontFamily: "var(--font-heading)" }}>
                {active.name} — Ledger
              </p>
              <div style={{ display: "flex", gap: 16, fontFamily: "var(--font-mono)", fontSize: 12 }}>
                {(() => {
                  const { totalAdvance, totalPaid, balance } = calcBalance(active.transactions);
                  return (
                    <>
                      <span style={{ color: "var(--danger)" }}>Advance: ₱{totalAdvance.toLocaleString("en-PH")}</span>
                      <span style={{ color: "var(--success)" }}>Paid: ₱{totalPaid.toLocaleString("en-PH")}</span>
                      <span style={{ color: balance >= 0 ? "var(--success)" : "var(--danger)", fontWeight: 500 }}>
                        Balance: {balance >= 0 ? "+" : "-"}₱{Math.abs(balance).toLocaleString("en-PH")}
                      </span>
                    </>
                  );
                })()}
              </div>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-faint)", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Transactions — newest first
            </p>
            <LedgerList financier={active} onDelete={(txId) => deleteTx(active._id, txId)} />
          </div>
        </div>
      )}
    </div>
  );
}
