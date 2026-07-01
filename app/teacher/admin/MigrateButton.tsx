"use client";

import { useState } from "react";

export function MigrateButton() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ applied: string[]; skipped: string[] } | null>(null);

  async function run() {
    if (!confirm("Apply pending database migrations? Safe to run multiple times.")) return;
    setBusy(true);
    const res = await fetch("/api/teacher/migrate", { method: "POST" });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { alert(data.error ?? "Migration failed."); return; }
    setResult(data);
  }

  if (result) {
    return (
      <div style={{ fontSize: 12, color: "#15803d" }}>
        ✓ {result.applied.length} applied, {result.skipped.length} already up-to-date
      </div>
    );
  }

  return (
    <button onClick={run} disabled={busy} style={{
      background: "#fff", border: "1px solid #d1d5db", color: "#475569",
      fontSize: 12, padding: "6px 12px", borderRadius: 4, cursor: busy ? "wait" : "pointer",
    }}>
      {busy ? "Running…" : "Apply DB migrations"}
    </button>
  );
}
