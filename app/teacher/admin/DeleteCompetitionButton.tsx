"use client";

import { useState } from "react";

export function DeleteCompetitionButton({ id, name, subCount }: { id: string; name: string; subCount: number }) {
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    const warning = subCount > 0
      ? `Delete "${name}"? This will also permanently delete ${subCount} submission${subCount === 1 ? "" : "s"} and all access codes. This cannot be undone.`
      : `Delete "${name}"? All access codes will be removed. This cannot be undone.`;
    if (!confirm(warning)) return;
    setBusy(true);
    const res = await fetch(`/api/teacher/competitions/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Failed to delete competition.");
      setBusy(false);
      return;
    }
    window.location.reload();
  }

  return (
    <button onClick={handleDelete} disabled={busy} style={{
      background: "#fff", border: "1px solid #fca5a5", color: "#dc2626",
      fontSize: 12, padding: "6px 12px", borderRadius: 4, cursor: busy ? "wait" : "pointer", opacity: busy ? 0.6 : 1,
    }}>
      {busy ? "Deleting…" : "Delete"}
    </button>
  );
}
