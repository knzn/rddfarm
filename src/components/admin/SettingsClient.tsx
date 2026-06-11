"use client";

import { useEffect, useState } from "react";
import { Save, CheckCircle, Plus, Trash2, KeyRound, Eye, EyeOff, Shield } from "lucide-react";

interface AdminUser {
  _id: string;
  email: string;
  createdAt: string;
}

export default function SettingsClient() {
  const [form, setForm] = useState({ messengerUrl: "", facebookUrl: "", phoneNumber: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Admin accounts state
  const [accounts, setAccounts] = useState<AdminUser[]>([]);
  const [accountsLoading, setAccountsLoading] = useState(true);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [newPass, setNewPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [accountSaving, setAccountSaving] = useState(false);
  const [accountError, setAccountError] = useState("");
  const [resetId, setResetId] = useState<string | null>(null);
  const [resetPass, setResetPass] = useState("");
  const [showResetPass, setShowResetPass] = useState(false);

  async function loadAccounts() {
    setAccountsLoading(true);
    const res = await fetch("/api/admin/accounts");
    const json = await res.json();
    setAccounts(json.data ?? []);
    setAccountsLoading(false);
  }

  useEffect(() => { loadAccounts(); }, []);

  async function addAccount(e: React.FormEvent) {
    e.preventDefault();
    setAccountSaving(true); setAccountError("");
    const res = await fetch("/api/admin/accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: newEmail, password: newPass }),
    });
    const json = await res.json();
    if (!res.ok) { setAccountError(json.error); setAccountSaving(false); return; }
    setNewEmail(""); setNewPass(""); setShowAddAccount(false); setAccountSaving(false);
    loadAccounts();
  }

  async function deleteAccount(id: string) {
    if (!confirm("Delete this admin account?")) return;
    const res = await fetch(`/api/admin/accounts/${id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) { alert(json.error); return; }
    loadAccounts();
  }

  async function resetPassword(id: string) {
    if (!resetPass || resetPass.length < 6) { setAccountError("Password must be at least 6 characters"); return; }
    setAccountSaving(true); setAccountError("");
    const res = await fetch(`/api/admin/accounts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: resetPass }),
    });
    const json = await res.json();
    if (!res.ok) { setAccountError(json.error); setAccountSaving(false); return; }
    setResetId(null); setResetPass(""); setAccountSaving(false);
  }

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

      {/* Admin Accounts */}
      <div className="rounded-[12px] p-5 border mt-8" style={{ background: "var(--bg-surface)", borderColor: "var(--border)" }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Shield size={15} style={{ color: "var(--accent)" }} />
            <h2 className="text-sm font-semibold uppercase tracking-wide" style={{ color: "var(--text-faint)" }}>Admin Accounts</h2>
          </div>
          <button onClick={() => { setShowAddAccount(!showAddAccount); setAccountError(""); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--accent)", color: "#fff" }}>
            <Plus size={12} /> Add Account
          </button>
        </div>

        {showAddAccount && (
          <form onSubmit={addAccount} className="mb-4 p-4 rounded-[10px] space-y-3" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
            <input type="email" placeholder="Email *" required value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              className="w-full rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle} />
            <div className="relative">
              <input type={showNewPass ? "text" : "password"} placeholder="Password (min 6 chars) *" required
                value={newPass} onChange={(e) => setNewPass(e.target.value)}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none pr-10" style={inputStyle} />
              <button type="button" onClick={() => setShowNewPass(!showNewPass)}
                className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }}>
                {showNewPass ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {accountError && <p className="text-xs" style={{ color: "var(--danger)" }}>{accountError}</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => { setShowAddAccount(false); setAccountError(""); }}
                className="px-3 py-1.5 rounded-lg text-xs" style={{ border: "1px solid var(--border)", color: "var(--text-muted)" }}>Cancel</button>
              <button type="submit" disabled={accountSaving}
                className="px-3 py-1.5 rounded-lg text-xs font-medium" style={{ background: "var(--accent)", color: "#fff" }}>
                {accountSaving ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        )}

        {accountsLoading ? (
          <div className="space-y-2">{[1, 2].map(i => <div key={i} className="h-14 rounded-[10px] animate-pulse" style={{ background: "var(--bg-raised)" }} />)}</div>
        ) : (
          <div className="space-y-2">
            {accounts.map((u) => (
              <div key={u._id}>
                <div className="flex items-center gap-3 px-4 py-3 rounded-[10px]" style={{ background: "var(--bg-raised)", border: "1px solid var(--border)" }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "var(--text-primary)" }}>{u.email}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>
                      Added {new Date(u.createdAt).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                    </p>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => { setResetId(resetId === u._id ? null : u._id); setResetPass(""); setAccountError(""); }}
                      className="p-1.5 rounded-lg" title="Reset password"
                      style={{ color: "var(--accent)", background: "var(--accent)15" }}>
                      <KeyRound size={13} />
                    </button>
                    <button onClick={() => deleteAccount(u._id)}
                      className="p-1.5 rounded-lg" title="Delete account"
                      style={{ color: "var(--danger)", background: "var(--danger)15" }}>
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {resetId === u._id && (
                  <div className="mt-1 p-3 rounded-[10px] space-y-2" style={{ background: "var(--bg-raised)", border: "1px solid var(--accent)40" }}>
                    <p className="text-xs font-semibold" style={{ color: "var(--accent)" }}>New password for {u.email}</p>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <input type={showResetPass ? "text" : "password"} placeholder="New password (min 6 chars)"
                          value={resetPass} onChange={(e) => setResetPass(e.target.value)}
                          className="w-full rounded-lg px-3 py-2 text-sm outline-none pr-10" style={inputStyle} />
                        <button type="button" onClick={() => setShowResetPass(!showResetPass)}
                          className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-faint)" }}>
                          {showResetPass ? <EyeOff size={14} /> : <Eye size={14} />}
                        </button>
                      </div>
                      <button onClick={() => resetPassword(u._id)} disabled={accountSaving}
                        className="px-3 py-2 rounded-lg text-xs font-medium shrink-0"
                        style={{ background: "var(--accent)", color: "#fff" }}>
                        {accountSaving ? "Saving..." : "Save"}
                      </button>
                    </div>
                    {accountError && <p className="text-xs" style={{ color: "var(--danger)" }}>{accountError}</p>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
