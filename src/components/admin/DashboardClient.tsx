"use client";

import { useEffect, useState } from "react";
import { TrendingUp, TrendingDown, Egg, Bird, Users, DollarSign } from "lucide-react";

interface DashboardData {
  breeding: {
    activeSeason: { name: string; year: number } | null;
    totalMatings: number;
    totalEggsLaid: number;
    totalChicksHatched: number;
    hatchRate: number | null;
  };
  finance: {
    expensesThisMonth: number;
    salesThisMonth: number;
    netIncome: number;
    unpaidWorkers: number;
  };
}

function StatCard({ label, value, sub, icon: Icon, color }: {
  label: string; value: string | number; sub?: string;
  icon: React.ElementType; color: string;
}) {
  return (
    <div className="rounded-[12px] p-6 border flex items-start gap-4"
      style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
      <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: `${color}20`, color }}>
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-xs uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>{label}</p>
        <p className="text-2xl font-bold mt-0.5 font-mono" style={{ color: "var(--text-primary)" }}>{value}</p>
        {sub && <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{sub}</p>}
      </div>
    </div>
  );
}

export default function DashboardClient() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((j) => setData(j.data))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n: number) =>
    n >= 0
      ? `₱${n.toLocaleString()}`
      : `-₱${Math.abs(n).toLocaleString()}`;

  return (
    <div>
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-1"
        style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
        Dashboard
      </h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>
        {data?.breeding.activeSeason
          ? `Active season: ${data.breeding.activeSeason.name} ${data.breeding.activeSeason.year}`
          : "No active season"}
      </p>

      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-[12px] h-28 animate-pulse"
              style={{ background: "var(--bg-surface)" }} />
          ))}
        </div>
      ) : (
        <>
          <p className="text-xs uppercase tracking-widest mb-3 font-semibold"
            style={{ color: "var(--text-faint)" }}>Finance — This Month</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard label="Sales" value={fmt(data?.finance.salesThisMonth ?? 0)}
              icon={TrendingUp} color="var(--success)" />
            <StatCard label="Expenses" value={fmt(data?.finance.expensesThisMonth ?? 0)}
              icon={TrendingDown} color="var(--danger)" />
            <StatCard label="Net Income" value={fmt(data?.finance.netIncome ?? 0)}
              icon={DollarSign}
              color={(data?.finance.netIncome ?? 0) >= 0 ? "var(--success)" : "var(--danger)"} />
            <StatCard label="Unpaid Workers" value={data?.finance.unpaidWorkers ?? 0}
              icon={Users} color="var(--warning)" sub="workers pending salary" />
          </div>

          <p className="text-xs uppercase tracking-widest mb-3 font-semibold"
            style={{ color: "var(--text-faint)" }}>Breeding</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Matings" value={data?.breeding.totalMatings ?? 0}
              icon={Bird} color="var(--accent)" />
            <StatCard label="Eggs Laid" value={data?.breeding.totalEggsLaid ?? 0}
              icon={Egg} color="var(--warning)" />
            <StatCard label="Chicks Hatched" value={data?.breeding.totalChicksHatched ?? 0}
              icon={Bird} color="var(--success)" />
            <StatCard
              label="Hatch Rate"
              value={data?.breeding.hatchRate != null ? `${data.breeding.hatchRate.toFixed(1)}%` : "—"}
              icon={TrendingUp} color="var(--success)" />
          </div>
        </>
      )}
    </div>
  );
}
