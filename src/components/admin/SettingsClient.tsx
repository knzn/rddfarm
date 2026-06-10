"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle } from "lucide-react";

export default function SettingsClient() {
  const [form, setForm] = useState({ messengerUrl: "", facebookUrl: "", phoneNumber: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((j) => {
        if (j.data) setForm({ messengerUrl: j.data.messengerUrl ?? "", facebookUrl: j.data.facebookUrl ?? "", phoneNumber: j.data.phoneNumber ?? "" });
        setLoading(false);
      });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true); setError(""); setSaved(false);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const j = await res.json();
      setError(j.error ?? "Save failed");
    } else {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  const inputStyle = { background: "var(--bg-raised)", border: "1px solid var(--border)", color: "var(--text-primary)" };
  const inputCls = "w-full rounded-lg px-3 py-2.5 text-sm outline-none";

  return (
    <div className="max-w-lg">
      <h1 className="text-3xl font-bold uppercase tracking-wide mb-2" style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>Settings</h1>
      <p className="text-sm mb-8" style={{ color: "var(--text-muted)" }}>Contact links shown on reservation forms and order pages.</p>

      {loading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-12 rounded-lg animate-pulse" style={{ background: "var(--bg-surface)" }} />)}</div>
      ) : (
        <form onSubmit={handleSave} className="space-y-5">
          <div className="rounded-[12px] p-5 border space-y-4" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Contact Info</h2>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Messenger Link
              </label>
              <input
                value={form.messengerUrl}
                onChange={(e) => setForm({ ...form, messengerUrl: e.target.value })}
                placeholder="https://m.me/your-page-name"
                className={inputCls} style={inputStyle}
              />
              <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Go to your Facebook page → Copy the m.me link</p>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Facebook Page / Profile Link
              </label>
              <input
                value={form.facebookUrl}
                onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })}
                placeholder="https://facebook.com/your-page"
                className={inputCls} style={inputStyle}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Phone / WhatsApp Number
              </label>
              <input
                value={form.phoneNumber}
                onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                placeholder="+63 912 345 6789"
                className={inputCls} style={inputStyle}
              />
            </div>
          </div>

          {error && <p className="text-sm" style={{ color: "var(--danger)" }}>{error}</p>}

          <button type="submit" disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-medium text-sm disabled:opacity-50 transition-all"
            style={{ background: saved ? "var(--success)" : "var(--accent)", color: "#fff" }}>
            {saved ? <><CheckCircle size={16} /> Saved!</> : <><Save size={16} /> {saving ? "Saving..." : "Save Settings"}</>}
          </button>
        </form>
      )}
    </div>
  );
}
