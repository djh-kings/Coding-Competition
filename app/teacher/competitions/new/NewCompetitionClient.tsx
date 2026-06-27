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

export function NewCompetitionClient() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("17:00");
  const [problemHtml, setProblemHtml] = useState("<h3>Problem title</h3>\n<p>Describe the problem here.</p>");
  const [codeCount, setCodeCount] = useState(20);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<{ codes: string[] } | null>(null);

  async function handlePublish() {
    setError("");
    if (!name.trim() || !date) {
      setError("Name and deadline are required.");
      return;
    }
    setSubmitting(true);
    try {
      const deadline = new Date(`${date}T${time}`).toISOString();
      const res = await fetch("/api/teacher/competitions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, deadline, problemHtml, testCases: [], codeCount }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Failed to publish");
      } else {
        setResult({ codes: data.codes });
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
        <div style={{ padding: "14px 24px", background: "#fff", borderBottom: "1px solid #e2e6ed" }}>
          <Link href="/teacher/dashboard" style={{ color: "#64748b", textDecoration: "none", fontSize: 13 }}>← Dashboard</Link>
        </div>
        <div style={{ maxWidth: 700, margin: "32px auto", padding: 32, background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
          <h1 style={{ fontSize: 22, fontWeight: 600, color: "#162233", marginBottom: 12 }}>Competition published</h1>
          <p style={{ fontSize: 14, color: "#64748b", marginBottom: 24, lineHeight: 1.6 }}>
            {result.codes.length} access codes generated. Distribute these to your students — each code can only be used once.
          </p>
          <div style={{ background: "#f7f8fa", border: "1px solid #e2e6ed", borderRadius: 4, padding: 20, fontFamily: "var(--font-mono)", fontSize: 14, color: "#162233", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 8, marginBottom: 24 }}>
            {result.codes.map(c => <div key={c} style={{ padding: "6px 10px", background: "#fff", borderRadius: 3, textAlign: "center" }}>{c}</div>)}
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <button onClick={() => navigator.clipboard.writeText(result.codes.join("\n"))} style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>
              Copy all
            </button>
            <button onClick={() => router.push("/teacher/dashboard")} style={{ background: "#2558d4", color: "#fff", border: "none", fontSize: 14, fontWeight: 500, padding: "10px 20px", borderRadius: 4, cursor: "pointer" }}>
              Go to dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      {/* Header */}
      <div style={{ padding: "14px 24px", background: "#fff", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
        <Link href="/teacher/dashboard" style={{ color: "#64748b", textDecoration: "none" }}>← Dashboard</Link>
        <span style={{ color: "#e2e6ed" }}>|</span>
        <span style={{ color: "#162233", fontWeight: 500 }}>New competition</span>
      </div>

      {/* Form */}
      <div style={{ maxWidth: 700, margin: "32px auto", padding: 32, background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.08)" }}>
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Competition name</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. The Fibonacci Cipher" style={{ ...inputStyle, width: "100%" }} />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Short description <span style={{ color: "#94a3b8", fontWeight: 400 }}>— shown on the landing page card</span></label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="e.g. A two-hour cryptography challenge for Years 10–13. Decode the cipher and find the hidden message."
            rows={2}
            maxLength={240}
            style={{ ...inputStyle, width: "100%", resize: "vertical", lineHeight: 1.5 }}
          />
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
          <textarea
            value={problemHtml}
            onChange={e => setProblemHtml(e.target.value)}
            rows={10}
            style={{ ...inputStyle, width: "100%", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.65, borderRadius: "0 0 4px 4px", resize: "vertical" }}
          />
        </div>

        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Student access codes</label>
          <p style={{ fontSize: 13, color: "#475569", display: "flex", alignItems: "center", gap: 8 }}>
            Generate
            <input type="number" min={1} max={200} value={codeCount} onChange={e => setCodeCount(Number(e.target.value))} style={{ ...inputStyle, width: 72, textAlign: "center", padding: "6px 8px", fontSize: 14 }} />
            unique codes.
          </p>
          <p style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>Each code is single-use and tied to one student.</p>
        </div>

        {error && <p style={{ fontSize: 13, color: "#dc2626", marginBottom: 16 }}>{error}</p>}

        <div style={{ borderTop: "1px solid #e2e6ed", paddingTop: 20, display: "flex", justifyContent: "flex-end", gap: 10 }}>
          <Link href="/teacher/dashboard" style={{ background: "#f7f8fa", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, fontWeight: 500, padding: "10px 18px", borderRadius: 4, textDecoration: "none" }}>
            Cancel
          </Link>
          <button onClick={handlePublish} disabled={submitting} style={{ background: "#2558d4", color: "#fff", border: "none", fontSize: 14, fontWeight: 500, padding: "10px 26px", borderRadius: 4, cursor: "pointer", opacity: submitting ? 0.7 : 1 }}>
            {submitting ? "Publishing…" : "Publish competition"}
          </button>
        </div>
      </div>
    </div>
  );
}
