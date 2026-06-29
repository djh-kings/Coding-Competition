"use client";

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";

interface Result {
  competitionName: string;
  displayName: string;
  submittedAt: string;
  closed: boolean;
  winner: boolean;
  shortlisted: boolean;
  comment: string | null;
}

export function ResultsClient() {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  async function handleCheck(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setResult(null);
    const trimmed = code.trim().toUpperCase();
    if (!trimmed) { setError("Please enter your confirmation code."); return; }
    setBusy(true);
    const res = await fetch(`/api/results/${encodeURIComponent(trimmed)}`);
    const data = await res.json();
    setBusy(false);
    if (!res.ok) { setError(data.error ?? "Could not check that code."); return; }
    setResult(data);
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", background: "#f7f8fa" }}>
      <nav style={{ height: 60, padding: "0 32px", background: "#fff", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e6ed" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Logo />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>KCS Code Challenge</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>← Home</Link>
      </nav>

      <main style={{ flex: 1, display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "60px 24px" }}>
        <div style={{ width: "100%", maxWidth: 480, background: "#fff", borderRadius: 6, border: "1px solid #e2e6ed", boxShadow: "0 1px 4px rgba(0,0,0,.06)", padding: 32 }}>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#162233", marginBottom: 8 }}>Check your result</h1>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
            Enter the <strong>confirmation code</strong> you wrote down after submitting. (This is not your access code — it&apos;s the one shown after you submitted.)
          </p>

          <form onSubmit={handleCheck} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="text"
              value={code}
              onChange={e => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AB23CD7Q"
              autoFocus
              style={{
                padding: "12px 14px",
                border: "1px solid #d1d5db",
                borderRadius: 4,
                fontSize: 16,
                fontFamily: "var(--font-mono)",
                letterSpacing: "0.05em",
                color: "#162233",
                outline: "none",
              }}
            />
            <button type="submit" disabled={busy} style={{
              background: "#2558d4", color: "#fff", border: "none",
              fontSize: 14, fontWeight: 500, padding: "12px", borderRadius: 4,
              cursor: busy ? "wait" : "pointer", opacity: busy ? 0.7 : 1,
            }}>
              {busy ? "Checking…" : "Check result"}
            </button>
          </form>

          {error && (
            <div style={{ marginTop: 16, padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 4, fontSize: 13, color: "#dc2626" }}>
              {error}
            </div>
          )}

          {result && (
            <div style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid #e2e6ed" }}>
              <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 4 }}>
                {result.competitionName}
              </div>
              <div style={{ fontSize: 16, fontWeight: 600, color: "#162233", marginBottom: 18 }}>
                {result.displayName}
              </div>

              {result.winner ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 6, padding: "18px 20px" }}>
                  <div style={{ fontSize: 26, marginBottom: 6 }}>🏆</div>
                  <div style={{ fontSize: 17, fontWeight: 700, color: "#15803d", marginBottom: 6 }}>You won!</div>
                  <div style={{ fontSize: 13, color: "#166534", lineHeight: 1.6 }}>
                    Congratulations — your submission was selected as the winner. Speak to your teacher to claim your prize.
                  </div>
                </div>
              ) : result.shortlisted ? (
                <div style={{ background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 6, padding: "18px 20px" }}>
                  <div style={{ fontSize: 22, marginBottom: 4 }}>★</div>
                  <div style={{ fontSize: 16, fontWeight: 700, color: "#b45309", marginBottom: 6 }}>Shortlisted</div>
                  <div style={{ fontSize: 13, color: "#92400e", lineHeight: 1.6 }}>
                    {result.closed
                      ? "Your submission was shortlisted, but wasn't selected as the winner this time. Great job!"
                      : "Your submission has been shortlisted! The teacher is still reviewing — check back after the deadline."}
                  </div>
                </div>
              ) : result.closed ? (
                <div style={{ background: "#f7f8fa", border: "1px solid #e2e6ed", borderRadius: 6, padding: "18px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#475569", marginBottom: 6 }}>Thanks for entering</div>
                  <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6 }}>
                    Your submission was received but wasn&apos;t selected this time. Better luck next competition!
                  </div>
                </div>
              ) : (
                <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "18px 20px" }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#1d4ed8", marginBottom: 6 }}>Submitted ✓</div>
                  <div style={{ fontSize: 13, color: "#1e40af", lineHeight: 1.6 }}>
                    Your entry has been received. The competition is still open — results will be available after judging.
                  </div>
                </div>
              )}

              {result.comment && (
                <div style={{ marginTop: 14, padding: "12px 14px", background: "#f7f8fa", border: "1px solid #e2e6ed", borderRadius: 4 }}>
                  <div style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.08em", marginBottom: 6 }}>Teacher comment</div>
                  <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{result.comment}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
