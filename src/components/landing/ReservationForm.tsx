"use client";

import { useEffect, useState } from "react";
import { CheckCircle, MessageCircle } from "lucide-react";

type ListingType = "pahulugan" | "months-old" | "day-old";

interface Bloodline { name: string; closed: boolean }
interface Price { category: string; amount: number }
interface Listing {
  _id: string; name: string; slug: string; type: ListingType;
  releaseDate: string; bloodlines: Bloodline[]; prices: Price[];
}

interface SubmitResult {
  publicUrl: string; messengerUrl: string;
  totalAmount: number; downPayment: number; balance: number;
  paymentPlan: string; weeklyAmount?: number; monthlyAmount?: number;
}

const PAYMENT_PLANS = [
  { value: "full", label: "Pay Full on Release" },
  { value: "flexible", label: "Flexible Payment" },
  { value: "weekly", label: "Pay Weekly (every Sunday)" },
  { value: "monthly", label: "Pay Monthly (every 1st)" },
];

function fmt(n: number) { return `₱${n.toLocaleString()}`; }

export default function ReservationForm({ slug, type }: { slug: string; type: ListingType }) {
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const [buyerName, setBuyerName] = useState("");
  const [buyerFacebook, setBuyerFacebook] = useState("");
  const [buyerNumber, setBuyerNumber] = useState("");
  const [paymentPlan, setPaymentPlan] = useState("full");

  // Pahulugan: single order item
  const [pahItem, setPahItem] = useState({ bloodline: "", category: "", qty: 1 });

  // Months/Day old: multiple rows
  const [rows, setRows] = useState([{ bloodline: "", qty: 1 }]);

  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`/api/listings/${slug}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setNotFound(true);
        else setListing(j.data);
        setLoading(false);
      });
  }, [slug]);

  const openBloodlines = listing?.bloodlines.filter((b) => !b.closed) ?? [];

  function calcTotal() {
    if (!listing) return { total: 0, down: 0, balance: 0 };
    if (type === "pahulugan") {
      const price = listing.prices.find((p) => p.category === pahItem.category)?.amount ?? 0;
      const total = price * pahItem.qty;
      const down = Math.ceil(total * 0.3);
      return { total, down, balance: total - down };
    } else {
      const pricePerHead = listing.prices[0]?.amount ?? 0;
      const total = rows.reduce((s, r) => s + r.qty * pricePerHead, 0);
      const down = Math.ceil(total * 0.5);
      return { total, down, balance: total - down };
    }
  }

  const { total, down, balance } = calcTotal();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!listing) return;
    setSubmitting(true); setError("");

    const items = type === "pahulugan"
      ? [{ bloodline: pahItem.bloodline, category: pahItem.category, quantity: pahItem.qty, unitPrice: listing.prices.find((p) => p.category === pahItem.category)?.amount ?? 0 }]
      : rows.filter((r) => r.bloodline && r.qty > 0).map((r) => ({ bloodline: r.bloodline, category: null, quantity: r.qty, unitPrice: listing.prices[0]?.amount ?? 0 }));

    const r = await fetch("/api/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listingSlug: slug, buyerName, buyerFacebook, buyerNumber, paymentPlan, items }),
    });
    const j = await r.json();
    if (j.error) { setError(j.error); setSubmitting(false); return; }
    setResult(j.data);
    setSubmitting(false);
  }

  const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
  const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm outline-none";

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--text-faint)" }}>Loading...</div>;
  if (notFound) return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--text-faint)" }}>Listing not found or no longer available.</div>;
  if (!listing) return null;

  if (result) {
    return (
      <div className="min-h-screen px-4 md:px-16 py-16 max-w-2xl mx-auto">
        <div className="rounded-[12px] p-8 border text-center" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <CheckCircle size={48} className="mx-auto mb-4" style={{ color: "var(--success)" }} />
          <h2 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Reservation Submitted!</h2>
          <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>Your order is pending admin confirmation. Your public link will go live once confirmed.</p>

          <div className="rounded-lg p-4 mb-6 text-left space-y-2" style={{ background: "var(--bg-raised)" }}>
            <div className="flex justify-between text-sm"><span style={{ color: "var(--text-muted)" }}>Total</span><span className="font-mono font-bold" style={{ color: "var(--text-primary)" }}>{fmt(result.totalAmount)}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: "var(--text-muted)" }}>Required Down Payment</span><span className="font-mono font-bold" style={{ color: "var(--warning)" }}>{fmt(result.downPayment)}</span></div>
            <div className="flex justify-between text-sm"><span style={{ color: "var(--text-muted)" }}>Balance</span><span className="font-mono font-bold" style={{ color: "var(--danger)" }}>{fmt(result.balance)}</span></div>
            {result.weeklyAmount && <div className="flex justify-between text-sm"><span style={{ color: "var(--text-muted)" }}>Weekly Payment</span><span className="font-mono" style={{ color: "var(--accent)" }}>{fmt(result.weeklyAmount)}/Sunday</span></div>}
            {result.monthlyAmount && <div className="flex justify-between text-sm"><span style={{ color: "var(--text-muted)" }}>Monthly Payment</span><span className="font-mono" style={{ color: "var(--accent)" }}>{fmt(result.monthlyAmount)}/month</span></div>}
          </div>

          <p className="text-xs mb-4" style={{ color: "var(--text-faint)" }}>Your order link: <span style={{ color: "var(--accent)" }}>{result.publicUrl}</span> (active after confirmation)</p>

          <a href={result.messengerUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-sm"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <MessageCircle size={16} /> Message Admin on Messenger
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 md:px-16 py-12 max-w-2xl mx-auto">
      <p className="text-xs uppercase tracking-widest mb-1 font-semibold" style={{ color: "var(--accent)" }}>{listing.type.replace("-", " ").toUpperCase()}</p>
      <h1 className="text-3xl font-bold uppercase mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{listing.name}</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Release: {new Date(listing.releaseDate).toLocaleDateString()}</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Buyer info */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Your Information</p>
          <input placeholder="Full Name *" required value={buyerName} onChange={(e) => setBuyerName(e.target.value)} className={inputCls} style={inputStyle} />
          <input placeholder="Facebook Name *" required value={buyerFacebook} onChange={(e) => setBuyerFacebook(e.target.value)} className={inputCls} style={inputStyle} />
          <input placeholder="Phone Number *" required value={buyerNumber} onChange={(e) => setBuyerNumber(e.target.value)} className={inputCls} style={inputStyle} />
        </div>

        {/* Order items */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Order</p>

          {type === "pahulugan" ? (
            <div className="space-y-3">
              <select required value={pahItem.bloodline} onChange={(e) => setPahItem({ ...pahItem, bloodline: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="">Select Bloodline *</option>
                {openBloodlines.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
              </select>
              <select required value={pahItem.category} onChange={(e) => setPahItem({ ...pahItem, category: e.target.value })} className={inputCls} style={inputStyle}>
                <option value="">Select Type *</option>
                {listing.prices.map((p) => <option key={p.category} value={p.category}>{p.category} — {fmt(p.amount)}</option>)}
              </select>
              <input type="number" min={1} required value={pahItem.qty} onChange={(e) => setPahItem({ ...pahItem, qty: +e.target.value })} className={inputCls} style={inputStyle} placeholder="Quantity" />
            </div>
          ) : (
            <div className="space-y-2">
              {rows.map((row, i) => (
                <div key={i} className="flex gap-2">
                  <select value={row.bloodline} onChange={(e) => setRows(rows.map((r, j) => j === i ? { ...r, bloodline: e.target.value } : r))} className={`flex-1 ${inputCls}`} style={inputStyle}>
                    <option value="">Bloodline</option>
                    {openBloodlines.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
                  </select>
                  <input type="number" min={1} value={row.qty} onChange={(e) => setRows(rows.map((r, j) => j === i ? { ...r, qty: +e.target.value } : r))} className="rounded-lg px-3 py-2.5 text-sm outline-none" style={{ ...inputStyle, width: 80 }} placeholder="Qty" />
                  {rows.length > 1 && <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))} className="px-2 rounded-lg text-sm" style={{ color: "var(--danger)" }}>✕</button>}
                </div>
              ))}
              <button type="button" onClick={() => setRows([...rows, { bloodline: "", qty: 1 }])} className="text-xs px-3 py-1.5 rounded-lg" style={{ border: "1px solid var(--border)", color: "var(--accent)" }}>+ Add Row</button>
              {listing.prices[0] && <p className="text-xs" style={{ color: "var(--text-muted)" }}>Price: {fmt(listing.prices[0].amount)} per head</p>}
            </div>
          )}
        </div>

        {/* Live calculation */}
        {total > 0 && (
          <div className="rounded-lg p-4 space-y-1.5" style={{ background: "var(--bg-raised)" }}>
            <div className="flex justify-between text-sm font-mono"><span style={{ color: "var(--text-muted)" }}>Total</span><span style={{ color: "var(--text-primary)" }}>{fmt(total)}</span></div>
            <div className="flex justify-between text-sm font-mono"><span style={{ color: "var(--text-muted)" }}>Required Down ({type === "pahulugan" ? "30%" : "50%"})</span><span style={{ color: "var(--warning)" }}>{fmt(down)}</span></div>
            <div className="flex justify-between text-sm font-mono font-bold"><span style={{ color: "var(--text-muted)" }}>Balance</span><span style={{ color: "var(--danger)" }}>{fmt(balance)}</span></div>
          </div>
        )}

        {/* Payment plan */}
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Payment Plan</p>
          {PAYMENT_PLANS.map((p) => (
            <label key={p.value} className="flex items-center gap-3 p-3 rounded-lg cursor-pointer border transition-all"
              style={{ background: paymentPlan === p.value ? "var(--accent-glow)" : "var(--bg-raised)", borderColor: paymentPlan === p.value ? "var(--accent)" : "var(--border)" }}>
              <input type="radio" name="plan" value={p.value} checked={paymentPlan === p.value} onChange={() => setPaymentPlan(p.value)} className="accent-blue-500" />
              <span className="text-sm" style={{ color: "var(--text-primary)" }}>{p.label}</span>
            </label>
          ))}
        </div>

        {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

        <button type="submit" disabled={submitting} className="w-full py-3 rounded-lg font-semibold text-sm disabled:opacity-50"
          style={{ background: "var(--accent)", color: "#fff" }}>
          {submitting ? "Submitting..." : "Submit Reservation"}
        </button>
      </form>
    </div>
  );
}
