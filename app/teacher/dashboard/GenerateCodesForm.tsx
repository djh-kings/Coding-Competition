"use client";

import { useState } from "react";

export function GenerateCodesForm({ competitionId }: { competitionId: string }) {
  const [count, setCount] = useState(5);
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState<string[] | null>(null);

  async function handleGenerate() {
    setBusy(true);
    const res = await fetch(`/api/teacher/competitions/${competitionId}/codes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ count }),
    });
    const data = await res.json();
    setBusy(false);
    if (!res.ok) {
      alert(data.error ?? "Failed to generate codes.");
      return;
    }
    setCreated(data.codes);
    setTimeout(() => window.location.reload(), 2500);
  }

  if (created) {
    return (
      <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#15803d" }}>
        ✓ Generated {created.length} new code{created.length === 1 ? "" : "s"}: <span style={{ fontFamily: "var(--font-mono)" }}>{created.join(", ")}</span> — refreshing…
      </div>
    );
  }

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 12, color: "#64748b" }}>Generate</span>
      <input
        type="number"
        min={1}
        max={200}
        value={count}
        onChange={e => setCount(Number(e.target.value))}
        style={{ width: 64, padding: "5px 8px", fontSize: 13, border: "1px solid #d1d5db", borderRadius: 4, textAlign: "center" }}
      />
      <span style={{ fontSize: 12, color: "#64748b" }}>more codes</span>
      <button onClick={handleGenerate} disabled={busy} style={{
        background: "#2558d4", color: "#fff", border: "none",
        fontSize: 12, fontWeight: 500, padding: "6px 14px", borderRadius: 4, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1,
      }}>
        {busy ? "Generating…" : "Generate"}
      </button>
    </div>
  );
}
