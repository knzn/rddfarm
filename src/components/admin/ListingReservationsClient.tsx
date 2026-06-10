"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, X, ChevronDown, ChevronUp, Plus, Trash2 } from "lucide-react";

interface Listing {
  _id: string; name: string; slug: string; type: string;
  releaseMonthStart: number; releaseMonthEnd: number; releaseYear: number;
  bloodlines: { name: string; closed: boolean }[];
  prices: { category: string; amount: number }[];
  isDone: boolean;
}

interface PaymentEntry {
  _id: string; amount: number; note?: string; paidAt: string;
}

interface Reservation {
  _id: string; buyerName: string; buyerFacebook: string; buyerNumber: string;
  listingSlug: string; totalAmount: number; downPayment: number; balance: number;
  paymentPlan: string; isConfirmed: boolean; publicUrl: string; createdAt: string;
  items: { bloodline: string; category?: string; quantity: number; unitPrice: number }[];
  payments: PaymentEntry[];
}

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function fmtRelease(l: Listing) {
  return `${MONTHS[l.releaseMonthStart - 1]} – ${MONTHS[l.releaseMonthEnd - 1]} ${l.releaseYear}`;
}
function fmt(n: number | null | undefined) { return `₱${(n ?? 0).toLocaleString()}`; }

export default function ListingReservationsClient({ slug }: { slug: string }) {
  const router = useRouter();
  const [listing, setListing] = useState<Listing | null>(null);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [lr, rr] = await Promise.all([
        fetch(`/api/listings/${slug}`),
        fetch(`/api/admin/reservations?listingSlug=${slug}`),
      ]);
      const lj = await lr.json();
      const rj = await rr.json();
      setListing(lj.data ?? null);
      setReservations(rj.data ?? []);
      setLoading(false);
    }
    load();
  }, [slug]);

  async function confirmReservation(id: string) {
    await fetch(`/api/admin/reservations/${id}/confirm`, { method: "PATCH" });
    setReservations((prev) => prev.map((r) => r._id === id ? { ...r, isConfirmed: true } : r));
  }

  async function rejectReservation(id: string) {
    if (!confirm("Reject and delete this reservation?")) return;
    await fetch(`/api/admin/reservations/${id}/reject`, { method: "PATCH" });
    setReservations((prev) => prev.filter((r) => r._id !== id));
  }

  function updateReservation(updated: Reservation) {
    setReservations((prev) => prev.map((r) => r._id === updated._id ? updated : r));
  }

  const confirmed = reservations.filter((r) => r.isConfirmed);
  const pending = reservations.filter((r) => !r.isConfirmed);

  return (
    <div>
      <button onClick={() => router.push("/admin/reservations")}
        className="flex items-center gap-2 text-sm mb-6 hover:opacity-70 transition-opacity"
        style={{ color: "var(--text-muted)" }}>
        <ArrowLeft size={16} /> Back to Reservations
      </button>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-20 rounded-[12px] animate-pulse" style={{ background: "var(--bg-surface)" }} />)}</div>
      ) : !listing ? (
        <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>Listing not found</div>
      ) : (
        <>
          {/* Listing header */}
          <div className="rounded-[12px] p-5 mb-6 border" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold uppercase tracking-wide" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{listing.name}</h1>
                  <span className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: listing.isDone ? "var(--text-faint)20" : "var(--success)20", color: listing.isDone ? "var(--text-faint)" : "var(--success)" }}>
                    {listing.isDone ? "Done" : "Active"}
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  Release: {fmtRelease(listing)} · {listing.type}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {listing.bloodlines.map((b, i) => (
                  <span key={i} className="text-xs px-2 py-0.5 rounded-full"
                    style={{ background: b.closed ? "var(--danger)20" : "var(--success)20", color: b.closed ? "var(--danger)" : "var(--success)", border: `1px solid ${b.closed ? "var(--danger)" : "var(--success)"}40` }}>
                    {b.name} {b.closed ? "● Full" : "● Open"}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex gap-6 mt-4 pt-4 border-t" style={{ borderColor: "var(--border)" }}>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono" style={{ color: "var(--text-primary)" }}>{reservations.length}</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>Total</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono" style={{ color: "var(--warning)" }}>{pending.length}</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>Pending</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono" style={{ color: "var(--success)" }}>{confirmed.length}</p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>Confirmed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold font-mono" style={{ color: "var(--accent)" }}>
                  {fmt(confirmed.reduce((s, r) => s + r.totalAmount, 0))}
                </p>
                <p className="text-xs" style={{ color: "var(--text-faint)" }}>Confirmed Value</p>
              </div>
            </div>
          </div>

          {pending.length > 0 && (
            <div className="mb-6">
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--warning)" }}>
                Pending ({pending.length})
              </h2>
              <div className="space-y-2">
                {pending.map((r) => (
                  <ReservationCard key={r._id} r={r} expanded={expanded} setExpanded={setExpanded}
                    onConfirm={confirmReservation} onReject={rejectReservation} onUpdate={updateReservation} />
                ))}
              </div>
            </div>
          )}

          {confirmed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--success)" }}>
                Confirmed ({confirmed.length})
              </h2>
              <div className="space-y-2">
                {confirmed.map((r) => (
                  <ReservationCard key={r._id} r={r} expanded={expanded} setExpanded={setExpanded}
                    onConfirm={confirmReservation} onReject={rejectReservation} onUpdate={updateReservation} />
                ))}
              </div>
            </div>
          )}

          {reservations.length === 0 && (
            <div className="text-center py-16" style={{ color: "var(--text-faint)" }}>No reservations yet for {listing.name}</div>
          )}
        </>
      )}
    </div>
  );
}

function ReservationCard({ r, expanded, setExpanded, onConfirm, onReject, onUpdate }: {
  r: Reservation;
  expanded: string | null;
  setExpanded: (id: string | null) => void;
  onConfirm: (id: string) => void;
  onReject: (id: string) => void;
  onUpdate: (r: Reservation) => void;
}) {
  const isOpen = expanded === r._id;
  const paymentsSum = (r.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const totalPaid = r.downPayment + paymentsSum;
  const remaining = r.totalAmount - totalPaid;

  const [showPayForm, setShowPayForm] = useState(false);
  const [payAmount, setPayAmount] = useState("");
  const [payNote, setPayNote] = useState("");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);
  const [saving, setSaving] = useState(false);

  async function addPayment() {
    const amount = Number(payAmount);
    if (!amount || amount <= 0) return;
    setSaving(true);
    const res = await fetch(`/api/admin/reservations/${r._id}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount, note: payNote, paidAt: payDate }),
    });
    if (res.ok) {
      const j = await res.json();
      onUpdate(j.data);
      setPayAmount(""); setPayNote(""); setPayDate(new Date().toISOString().split("T")[0]);
      setShowPayForm(false);
    }
    setSaving(false);
  }

  async function deletePayment(paymentId: string) {
    if (!confirm("Remove this payment?")) return;
    const res = await fetch(`/api/admin/reservations/${r._id}/payments`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentId }),
    });
    if (res.ok) {
      const j = await res.json();
      onUpdate(j.data);
    }
  }

  const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div className="rounded-[12px] border overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <div className="flex items-center justify-between px-5 py-4 cursor-pointer" onClick={() => setExpanded(isOpen ? null : r._id)}>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{r.buyerName}</span>
            <span className="text-xs px-2 py-0.5 rounded-full"
              style={{ background: r.isConfirmed ? "var(--success)20" : "var(--warning)20", color: r.isConfirmed ? "var(--success)" : "var(--warning)" }}>
              {r.isConfirmed ? "Confirmed" : "Pending"}
            </span>
            {totalPaid > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full"
                style={{ background: "var(--accent)20", color: "var(--accent)" }}>
                {fmt(totalPaid)} paid
              </span>
            )}
          </div>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {fmt(r.totalAmount)} · {r.paymentPlan} · Balance: <span style={{ color: remaining > 0 ? "var(--danger)" : "var(--success)" }}>{fmt(remaining)}</span> · {new Date(r.createdAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!r.isConfirmed && (
            <>
              <button onClick={(e) => { e.stopPropagation(); onConfirm(r._id); }}
                className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium"
                style={{ background: "var(--success)", color: "#fff" }}>
                <Check size={12} /> Confirm
              </button>
              <button onClick={(e) => { e.stopPropagation(); onReject(r._id); }}
                className="p-1.5 rounded-lg" style={{ color: "var(--danger)" }}>
                <X size={14} />
              </button>
            </>
          )}
          {isOpen ? <ChevronUp size={16} style={{ color: "var(--text-muted)" }} /> : <ChevronDown size={16} style={{ color: "var(--text-muted)" }} />}
        </div>
      </div>

      {isOpen && (
        <div className="px-5 pb-5 border-t pt-4 space-y-3" style={{ borderColor: "var(--border)" }}>
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>FB: {r.buyerFacebook} · {r.buyerNumber}</p>

          {/* Order items */}
          <div className="space-y-1">
            {r.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span style={{ color: "var(--text-muted)" }}>{item.bloodline}{item.category ? ` (${item.category})` : ""} × {item.quantity}</span>
                <span className="font-mono" style={{ color: "var(--text-primary)" }}>{fmt(item.quantity * item.unitPrice)}</span>
              </div>
            ))}
          </div>

          {/* Payment summary */}
          <div className="pt-2 border-t text-sm font-mono space-y-0.5" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <div className="flex justify-between"><span>Total</span><span style={{ color: "var(--text-primary)" }}>{fmt(r.totalAmount)}</span></div>
            <div className="flex justify-between"><span>Down Payment</span><span style={{ color: "var(--warning)" }}>{fmt(r.downPayment)}</span></div>
            {paymentsSum > 0 && <div className="flex justify-between"><span>Additional Payments</span><span style={{ color: "var(--accent)" }}>{fmt(paymentsSum)}</span></div>}
            <div className="flex justify-between"><span>Total Paid</span><span style={{ color: "var(--accent)" }}>{fmt(totalPaid)}</span></div>
            <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: "var(--border)" }}>
              <span>Remaining Balance</span>
              <span style={{ color: remaining <= 0 ? "var(--success)" : "var(--danger)" }}>{fmt(Math.max(remaining, 0))}</span>
            </div>
          </div>

          {/* Payment history */}
          {(r.payments ?? []).length > 0 && (
            <div className="rounded-lg overflow-hidden" style={{ border: "1px solid var(--border)" }}>
              <div className="px-3 py-2" style={{ background: "var(--bg-raised)" }}>
                <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Payment History</p>
              </div>
              {r.payments.map((p) => (
                <div key={p._id} className="flex items-center justify-between px-3 py-2 border-t text-sm" style={{ borderColor: "var(--border)" }}>
                  <div>
                    <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>{fmt(p.amount)}</span>
                    {p.note && <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>{p.note}</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                      {new Date(p.paidAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </span>
                    <button onClick={() => deletePayment(p._id)} className="p-1 rounded hover:opacity-70" style={{ color: "var(--danger)" }}>
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Add payment form */}
          {r.isConfirmed && (
            <div>
              {!showPayForm ? (
                <button onClick={() => setShowPayForm(true)}
                  className="flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg font-medium"
                  style={{ background: "var(--accent)20", color: "var(--accent)", border: "1px solid var(--accent)40" }}>
                  <Plus size={14} /> Add Payment
                </button>
              ) : (
                <div className="rounded-lg p-3 space-y-2" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                  <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Record Payment</p>
                  <div className="flex gap-2">
                    <input
                      type="number" placeholder="Amount (₱)" value={payAmount}
                      onChange={(e) => setPayAmount(e.target.value)}
                      className="flex-1 rounded-lg px-3 py-2 text-sm outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="date" value={payDate}
                      onChange={(e) => setPayDate(e.target.value)}
                      className="rounded-lg px-3 py-2 text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <input
                    type="text" placeholder="Note (optional)" value={payNote}
                    onChange={(e) => setPayNote(e.target.value)}
                    className="w-full rounded-lg px-3 py-2 text-sm outline-none"
                    style={inputStyle}
                  />
                  <div className="flex gap-2">
                    <button onClick={addPayment} disabled={saving || !payAmount}
                      className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
                      style={{ background: "var(--success)", color: "#fff" }}>
                      <Check size={12} /> {saving ? "Saving..." : "Save Payment"}
                    </button>
                    <button onClick={() => setShowPayForm(false)}
                      className="text-xs px-3 py-1.5 rounded-lg"
                      style={{ color: "var(--text-muted)", border: "1px solid var(--border)" }}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {r.isConfirmed && (
            <p className="text-xs break-all" style={{ color: "var(--success)" }}>Public link: {r.publicUrl}</p>
          )}
        </div>
      )}
    </div>
  );
}
