"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Calendar } from "lucide-react";

interface ScheduleEntry { dueDate: string; amount: number }
interface Item { bloodline: string; category?: string; quantity: number; unitPrice: number }
interface Order {
  buyerName: string; buyerFacebook: string; listingSlug: string; listingType: string;
  totalAmount: number; downPayment: number; balance: number;
  paymentPlan: string; weeklyAmount?: number; monthlyAmount?: number;
  paymentSchedule?: ScheduleEntry[];
  messengerUrl: string; items: Item[];
}

function fmt(n: number) { return `₱${n.toLocaleString()}`; }

export default function OrderView({ listingSlug, buyerSlug }: { listingSlug: string; buyerSlug: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`/api/reservations/${listingSlug}/${buyerSlug}`)
      .then((r) => r.json())
      .then((j) => {
        if (j.error) setNotFound(true);
        else setOrder(j.data);
        setLoading(false);
      });
  }, [listingSlug, buyerSlug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center" style={{ color: "var(--text-faint)" }}>Loading...</div>;
  if (notFound || !order) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-2" style={{ color: "var(--text-faint)" }}>
      <p className="text-lg font-semibold" style={{ color: "var(--text-muted)" }}>Order not found</p>
      <p className="text-sm">This link is not yet active or doesn't exist.</p>
    </div>
  );

  return (
    <div className="min-h-screen px-4 md:px-16 py-12 max-w-2xl mx-auto">
      <p className="text-xs uppercase tracking-widest mb-1" style={{ color: "var(--accent)" }}>{order.listingType.replace("-", " ").toUpperCase()} — {order.listingSlug.toUpperCase()}</p>
      <h1 className="text-3xl font-bold uppercase mb-1" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>{order.buyerName}</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>FB: {order.buyerFacebook}</p>

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
          <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Balance</span><span className="font-bold" style={{ color: "var(--danger)" }}>{fmt(order.balance)}</span></div>
          <div className="flex justify-between pt-1 border-t" style={{ borderColor: "var(--border)" }}>
            <span style={{ color: "var(--text-muted)" }}>Payment Plan</span>
            <span className="capitalize" style={{ color: "var(--accent)" }}>{order.paymentPlan}</span>
          </div>
          {order.weeklyAmount && <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Weekly Amount</span><span style={{ color: "var(--accent)" }}>{fmt(order.weeklyAmount)}/Sunday</span></div>}
          {order.monthlyAmount && <div className="flex justify-between"><span style={{ color: "var(--text-muted)" }}>Monthly Amount</span><span style={{ color: "var(--accent)" }}>{fmt(order.monthlyAmount)}/month</span></div>}
        </div>
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

      <a href={order.messengerUrl} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 w-full py-3 rounded-lg font-semibold text-sm"
        style={{ background: "var(--accent)", color: "#fff" }}>
        <MessageCircle size={16} /> Message Admin on Messenger
      </a>
    </div>
  );
}
