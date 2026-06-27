"use client";

import { useState } from "react";

export function ListedToggleButton({ id, listed }: { id: string; listed: boolean }) {
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const res = await fetch(`/api/teacher/competitions/${id}/listed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ listed: !listed }),
    });
    if (!res.ok) {
      alert("Failed to update.");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return (
    <button onClick={toggle} disabled={busy} title={listed ? "Hide from public landing page" : "Show on public landing page"} style={{
      background: "#fff",
      border: `1px solid ${listed ? "#d1d5db" : "#bfdbfe"}`,
      color: listed ? "#475569" : "#2558d4",
      fontSize: 12, padding: "6px 12px", borderRadius: 4, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1,
    }}>
      {busy ? "…" : listed ? "Hide from landing" : "Show on landing"}
    </button>
  );
}
