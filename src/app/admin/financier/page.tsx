import FinancierClient from "@/components/admin/FinancierClient";

export const metadata = { title: "Financier — RDD GameFarm" };

export default function FinancierPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-wide" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
          Financier
        </h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Track advances and payments per financier
        </p>
      </div>
      <FinancierClient />
    </div>
  );
}
