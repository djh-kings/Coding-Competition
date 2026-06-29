"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const inputStyle: React.CSSProperties = {
  padding: "10px 14px",
  border: "1px solid #d1d5db",
  borderRadius: 4,
  fontSize: 14,
  color: "#162233",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: 12,
  fontWeight: 500,
  color: "#475569",
  marginBottom: 8,
};

interface Props {
  id: string;
  name: string;
  description: string;
  deadline: string;
  problemHtml: string;
  submissionCount: number;
}

export function EditCompetitionClient({ id, name: initialName, description: initialDescription, deadline: initialDeadline, problemHtml: initialProblemHtml, submissionCount }: Props) {
  const router = useRouter();

  // Parse ISO deadline into local date + time
  const d = new Date(initialDeadline);
  const pad = (n: number) => n.toString().padStart(2, "0");
  const initialDate = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const initialTime = `${pad(d.getHours())}:${pad(d.getMinutes())}`;

  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [date, setDate] = useState(initialDate);
  const [time, setTime] = useState(initialTime);
  const [problemHtml, setProblemHtml] = useState(initialProblemHtml);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const problemChanged = problemHtml !== initialProblemHtml;
  const hasSubmissions = submissionCount > 0;

  async function handleSave() {
    setError("");
    if (!name.trim() || !date) {
      setError("Name and deadline are required.");
      return;
    }
    if (problemChanged && hasSubmissions) {
      if (!confirm(`This competition already has ${submissionCount} submission${submissionCount === 1 ? "" : "s"}. Changing the problem statement now may invalidate existing entries. Continue?`)) return;
    }
    setSaving(true);
    const deadline = new Date(`${date}T${time}`).toISOString();
    const res = await fetch(`/api/teacher/competitions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, deadline, problemHtml }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Failed to save.");
      return;
    }
    router.push("/teacher/admin");
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <div style={{ padding: "14px 24px", background: "#fff", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
        <Link href="/teacher/admin" style={{ color: "#64748b", textDecoration: "none" }}>← Admin</Link>
        <span style={{ color: "#e2e6ed" }}>|</span>
        <span style={{ color: "#162233", fontWeight: 500 }}>Edit competition</span>
      </div>

      <div style={{ maxWidth: 700, margin: "32px auto", padding: 32, background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
        {hasSubmissions && (
          <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 4, padding: "10px 14px", fontSize: 13, color: "#92400e", marginBottom: 24 }}>
            ⚠ This competition has {submissionCount} submission{submissionCount === 1 ? "" : "s"}. Changing the problem statement now may invalidate existing entries.
          </div>
        )}

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Competition name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, width: "100%" }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Short description <span style={{ color: "#94a3b8", fontWeight: 400 }}>— shown on the landing page card</span></label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} maxLength={240} style={{ ...inputStyle, width: "100%", resize: "vertical", lineHeight: 1.5 }} />
          <p style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{description.length}/240 characters</p>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Deadline</label>
          <div style={{ display: "flex", gap: 10 }}>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ ...inputStyle, flex: 1 }} />
            <input type="time" value={time} onChange={e => setTime(e.target.value)} style={{ ...inputStyle, width: 140 }} />
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Problem statement (HTML)</label>
          <div style={{ background: "#f7f8fa", border: "1px solid #e2e6ed", borderBottom: "none", borderRadius: "4px 4px 0 0", padding: "6px 8px", fontSize: 11, color: "#64748b" }}>
            Tip: use &lt;h3&gt;, &lt;p&gt;, &lt;code&gt;, &lt;pre&gt; and &lt;div class=&quot;info-box&quot;&gt; for styled boxes.
          </div>
          <textarea value={problemHtml} onChange={e => setProblemHtml(e.target.value)} rows={12} style={{ ...inputStyle, width: "100%", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.65, borderRadius: "0 0 4px 4px", resize: "vertical" }} />
        </div>

        {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{error}</p>}

        <div style={{ borderTop: "1px solid #e2e6ed", paddingTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Link href="/teacher/admin" style={{ background: "#f7f8fa", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, fontWeight: 500, padding: "10px 18px", borderRadius: 4, textDecoration: "none" }}>
            Cancel
          </Link>
          <button onClick={handleSave} disabled={saving} style={{ background: "#2558d4", color: "#fff", border: "none", fontSize: 14, fontWeight: 500, padding: "10px 26px", borderRadius: 4, cursor: saving ? "wait" : "pointer", opacity: saving ? 0.7 : 1 }}>
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
