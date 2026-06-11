export default function OfflinePage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ background: "var(--bg-base)" }}>
      <div className="mb-6 text-6xl">🐓</div>
      <h1 className="text-4xl font-bold mb-3 uppercase tracking-wide"
        style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}>
        You're Offline
      </h1>
      <p className="text-sm mb-8 max-w-xs" style={{ color: "var(--text-muted)" }}>
        No internet connection detected. Check your connection and try again.
      </p>
      <button onClick={() => window.location.reload()}
        className="px-6 py-3 rounded-lg font-semibold text-sm"
        style={{ background: "var(--accent)", color: "#fff" }}>
        Try Again
      </button>
    </div>
  );
}
