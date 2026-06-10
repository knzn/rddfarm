"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Calendar, Clock } from "lucide-react";

interface ScheduleEntry { dueDate: string; amount: number }
interface Item { bloodline: string; category?: string; quantity: number; unitPrice: number }
interface PaymentEntry { _id: string; amount: number; note?: string; paidAt: string }
interface Order {
  buyerName: string; buyerFacebook: string; listingSlug: string; listingType: string;
  totalAmount: number; downPayment: number; balance: number;
  paymentPlan: string; weeklyAmount?: number; monthlyAmount?: number;
  paymentSchedule?: ScheduleEntry[];
  payments: PaymentEntry[];
  messengerUrl: string; items: Item[]; isConfirmed: boolean;
}

interface Listing {
  name: string; releaseMonthStart: number; releaseMonthEnd: number; releaseYear: number;
}

interface ContactSettings { messengerUrl: string; facebookUrl: string; phoneNumber: string }

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
function fmtRelease(l: Listing) {
  return `${MONTHS[l.releaseMonthStart - 1]} – ${MONTHS[l.releaseMonthEnd - 1]} ${l.releaseYear}`;
}

function ContactButtons({ contact }: { contact: ContactSettings }) {
  return (
    <div className="space-y-2">
      {contact.messengerUrl && (
        <a href={contact.messengerUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm"
          style={{ background: "var(--accent)", color: "#fff" }}>
          <MessageCircle size={16} /> Message RDD on Messenger
        </a>
      )}
      {contact.facebookUrl && (
        <a href={contact.facebookUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm"
          style={{ background: "#1877F2", color: "#fff" }}>
          <MessageCircle size={16} /> Visit RDD on Facebook
        </a>
      )}
      {contact.phoneNumber && (
        <a href={`tel:${contact.phoneNumber.replace(/\s/g, "")}`}
          className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm border"
          style={{ border: "1px solid var(--border)", color: "var(--text-primary)", background: "var(--bg-raised)" }}>
          📞 {contact.phoneNumber}
        </a>
      )}
    </div>
  );
}

function fmt(n: number) { return `₱${n.toLocaleString()}`; }

export default function OrderView({ listingSlug, buyerSlug }: { listingSlug: string; buyerSlug: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [listing, setListing] = useState<Listing | null>(null);
  const [contact, setContact] = useState<ContactSettings>({ messengerUrl: "", facebookUrl: "", phoneNumber: "" });
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch(`/api/reservations/${listingSlug}/${buyerSlug}`).then((r) => r.json()),
      fetch(`/api/listings/${listingSlug}`).then((r) => r.json()),
      fetch("/api/settings").then((r) => r.json()),
    ]).then(([rj, lj, sj]) => {
      if (rj.error) setNotFound(true);
      else { setOrder(rj.data); setListing(lj.data ?? null); }
      if (sj.data) setContact(sj.data);
      setLoading(false);
    });
  }, [listingSlug, buyerSlug]);

  const paymentsSum = (order?.payments ?? []).reduce((s, p) => s + p.amount, 0);
  const totalPaid = order ? order.downPayment + paymentsSum : 0;
  const remaining = order ? order.totalAmount - totalPaid : 0;

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--text-faint)" }}>Loading...</div>;
  if (notFound || !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2" style={{ color: "var(--text-faint)" }}>
      <p className="text-lg font-semibold" style={{ color: "var(--text-muted)" }}>Order not found</p>
      <p className="text-sm">This link doesn't exist.</p>
    </div>
  );

  // Pending confirmation screen
  if (!order.isConfirmed) return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-[12px] border p-8 text-center" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "var(--warning)20" }}>
          <Clock size={32} style={{ color: "var(--warning)" }} />
        </div>
        <h2 className="text-xl font-bold uppercase mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
          Pending Confirmation
        </h2>
        <p className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>
          Hi <span className="font-semibold" style={{ color: "var(--text-primary)" }}>{order.buyerName}</span>, your reservation for
        </p>
        <p className="text-base font-bold mb-1 uppercase" style={{ color: "var(--accent)" }}>{order.listingSlug}</p>
        {listing && (
          <div className="flex items-center justify-center gap-1.5 mb-4">
            <Calendar size={13} style={{ color: "var(--text-faint)" }} />
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>Release: </span>
            <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{fmtRelease(listing)}</span>
          </div>
        )}
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          is waiting for RDD GameFarm to confirm your payment. Once confirmed, this page will show your full order details.
        </p>

        {/* Order summary even while pending */}
        <div className="rounded-lg p-4 mb-6 text-left space-y-2" style={{ background: "var(--bg-raised)" }}>
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span style={{ color: "var(--text-muted)" }}>{item.bloodline}{item.category ? ` (${item.category})` : ""} × {item.quantity}</span>
              <span className="font-mono" style={{ color: "var(--text-primary)" }}>{fmt(item.quantity * item.unitPrice)}</span>
            </div>
          ))}
          <div className="pt-2 border-t space-y-1 font-mono text-sm" style={{ borderColor: "var(--border)" }}>
            <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Total</span><span style={{ color: "var(--text-primary)" }}>{fmt(order.totalAmount)}</span></div>
            <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Down Payment</span><span style={{ color: "var(--warning)" }}>{fmt(order.downPayment)}</span></div>
            {totalPaid > 0 && <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Total Paid</span><span style={{ color: "var(--accent)" }}>{fmt(totalPaid)}</span></div>}
            <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: "var(--border)" }}>
              <span style={{ color: "var(--text-muted)" }}>Remaining Balance</span>
              <span style={{ color: remaining <= 0 ? "var(--success)" : "var(--danger)" }}>{fmt(Math.max(remaining, 0))}</span>
            </div>
          </div>
        </div>

        <ContactButtons contact={contact} />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen px-4 md:px-16 py-12 max-w-2xl mx-auto">
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>{order.listingType.replace("-", " ").toUpperCase()} — {order.listingSlug.toUpperCase()}</p>
      <h1 className="text-3xl font-bold uppercase mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{order.buyerName}</h1>
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>FB: {order.buyerFacebook}</p>
      {listing && (
        <div className="flex items-center gap-1.5 mt-2 mb-8">
          <Calendar size={13} style={{ color: "var(--text-faint)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Release: </span>
          <span className="text-sm font-semibold" style={{ color: "var(--accent)" }}>{fmtRelease(listing)}</span>
        </div>
      )}
      {!listing && <div className="mb-8" />}

      {/* Order items */}
      <div className="rounded-[12px] border mb-6 overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Order Items</p>
        </div>
        {order.items.map((item, i) => (
          <div key={i} className="flex justify-between px-5 py-3 text-sm border-b last:border-0" style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text-muted)" }}>{item.bloodline}{item.category ? ` (${item.category})` : ""} × {item.quantity}</span>
            <span className="font-mono font-semibold" style={{ color: "var(--text-primary)" }}>{fmt(item.quantity * item.unitPrice)}</span>
          </div>
        ))}
      </div>

      {/* Payment summary */}
      <div className="rounded-[12px] border mb-6 overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="px-5 py-3 border-b" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Payment Summary</p>
        </div>
        <div className="px-5 py-4 space-y-2 font-mono text-sm">
          <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Total</span><span className="font-bold" style={{ color: "var(--text-primary)" }}>{fmt(order.totalAmount)}</span></div>
          <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Required Down</span><span className="font-bold" style={{ color: "var(--warning)" }}>{fmt(order.downPayment)}</span></div>
          {totalPaid > 0 && <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Total Paid</span><span className="font-bold" style={{ color: "var(--accent)" }}>{fmt(totalPaid)}</span></div>}
          <div className="flex justify-between font-bold pt-1 border-t" style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text-muted)" }}>Remaining Balance</span>
            <span style={{ color: remaining <= 0 ? "var(--success)" : "var(--danger)" }}>{fmt(Math.max(remaining, 0))}</span>
          </div>
          <div className="flex justify-between pt-1 border-t" style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text-muted)" }}>Payment Plan</span>
            <span className="capitalize" style={{ color: "var(--accent)" }}>{order.paymentPlan}</span>
          </div>
          {order.weeklyAmount && <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Weekly Amount</span><span style={{ color: "var(--accent)" }}>{fmt(order.weeklyAmount)}/Sunday</span></div>}
          {order.monthlyAmount && <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Monthly Amount</span><span style={{ color: "var(--accent)" }}>{fmt(order.monthlyAmount)}/month</span></div>}
        </div>
        {/* Payment history */}
        {(order.payments ?? []).length > 0 && (
          <div className="border-t" style={{ borderColor: "var(--border)" }}>
            <div className="px-5 py-2" style={{ background: "var(--bg-raised)" }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Payment History</p>
            </div>
            {order.payments.map((p) => (
              <div key={p._id} className="flex justify-between items-center px-5 py-2.5 border-t text-sm" style={{ borderColor: "var(--border)" }}>
                <div>
                  <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>{fmt(p.amount)}</span>
                  {p.note && <span className="ml-2 text-xs" style={{ color: "var(--text-muted)" }}>{p.note}</span>}
                </div>
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                  {new Date(p.paidAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment schedule */}
      {order.paymentSchedule && order.paymentSchedule.length > 0 && (
        <div className="rounded-[12px] border mb-6 overflow-hidden" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
          <div className="px-5 py-3 border-b flex items-center gap-2" style={{ borderColor: "var(--border)", background: "var(--bg-raised)" }}>
            <Calendar size={14} style={{ color: "var(--text-faint)" }} />
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Payment Schedule ({order.paymentSchedule.length} payments)</p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {order.paymentSchedule.map((entry, i) => (
              <div key={i} className="flex justify-between px-5 py-2.5 text-sm border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <span style={{ color: "var(--text-muted)" }}>{new Date(entry.dueDate).toLocaleDateString("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}</span>
                <span className="font-mono font-semibold" style={{ color: "var(--accent)" }}>{fmt(entry.amount)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <ContactButtons contact={contact} />
    </div>
  );
}
