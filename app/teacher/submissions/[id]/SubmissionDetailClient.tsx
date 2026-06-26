"use client";

import { useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { runWithTests, type RunOutput } from "@/lib/runner";

const CodeEditor = dynamic(() => import("@/components/CodeEditor").then(m => ({ default: m.CodeEditor })), { ssr: false });

interface Submission {
  id: string;
  code: string;
  language: string;
  confirmationCode: string;
  shortlisted: boolean | null;
  winner: boolean | null;
  comment: string | null;
  submittedAt: string | null;
  studentName: string | null;
}

export function SubmissionDetailClient({ submission }: { submission: Submission }) {
  const [shortlisted, setShortlisted] = useState(submission.shortlisted ?? false);
  const [winner, setWinner] = useState(submission.winner ?? false);
  const [comment, setComment] = useState(submission.comment ?? "");
  const [commentSaved, setCommentSaved] = useState(false);
  const [runOutput, setRunOutput] = useState<RunOutput | null>(null);
  const [running, setRunning] = useState(false);
  const [stdin, setStdin] = useState("");
  const [confirmWinner, setConfirmWinner] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function patch(body: object) {
    await fetch(`/api/teacher/submissions/${submission.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  async function toggleShortlisted() {
    const next = !shortlisted;
    setShortlisted(next);
    await patch({ shortlisted: next });
  }

  async function confirmMarkWinner() {
    setWinner(true);
    setConfirmWinner(false);
    await patch({ winner: true });
  }

  async function saveComment() {
    await patch({ comment });
    setCommentSaved(true);
    setTimeout(() => setCommentSaved(false), 2000);
  }

  async function handleRun() {
    setRunning(true);
    try {
      setRunOutput(await runWithTests(submission.code, submission.language, [], stdin));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setRunOutput({ stdout: "", stderr: msg, exitCode: 1, duration: "0", testResults: [] });
    } finally {
      setRunning(false);
    }
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Header */}
      <div style={{ padding: "14px 24px", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 13 }}>
          <Link href="/teacher/dashboard" style={{ color: "#64748b", textDecoration: "none" }}>← Back to list</Link>
          <span style={{ color: "#e2e6ed" }}>|</span>
          <span style={{ fontWeight: 600, color: "#162233", fontSize: 14 }}>{submission.studentName ?? "Student"}</span>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "#94a3b8" }}>{submission.confirmationCode}</span>
          <span style={{ fontSize: 12, color: "#94a3b8" }}>
            {submission.submittedAt ? new Date(submission.submittedAt).toLocaleString("en-GB") : ""}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={toggleShortlisted} style={{
            background: shortlisted ? "#fffbeb" : "#fff",
            border: `1px solid ${shortlisted ? "#fde68a" : "#d1d5db"}`,
            color: shortlisted ? "#b45309" : "#475569",
            fontSize: 13, padding: "7px 14px", borderRadius: 4, cursor: "pointer",
          }}>
            {shortlisted ? "★ Shortlisted" : "☆ Shortlist"}
          </button>
          <button onClick={() => !winner && setConfirmWinner(true)} disabled={winner} style={{
            background: "#162233", color: "#fff", border: "none",
            fontSize: 13, fontWeight: 500, padding: "7px 14px", borderRadius: 4,
            cursor: winner ? "not-allowed" : "pointer", opacity: winner ? 0.6 : 1,
          }}>
            {winner ? "🏆 Winner" : "Mark as winner"}
          </button>
          <button onClick={() => setConfirmDelete(true)} style={{
            background: "#fff", border: "1px solid #fca5a5", color: "#dc2626",
            fontSize: 13, padding: "7px 14px", borderRadius: 4, cursor: "pointer",
          }}>
            Delete
          </button>
        </div>
      </div>

      {/* Body */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: read-only editor */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <CodeEditor value={submission.code} language={submission.language} readOnly height="400px" />

          {/* Stdin input */}
          <div style={{ background: "#1a1f35", borderTop: "1px solid #0d0f1a", padding: "8px 16px" }}>
            <div style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "#475569", marginBottom: 4 }}>Input (stdin) — one value per line</div>
            <textarea
              value={stdin}
              onChange={e => setStdin(e.target.value)}
              rows={2}
              placeholder={"e.g.\n5\n10"}
              style={{ width: "100%", background: "#0d0f1a", border: "1px solid #313654", borderRadius: 4, color: "#cbd5e1", fontFamily: "var(--font-mono)", fontSize: 12, padding: "6px 10px", resize: "vertical", boxSizing: "border-box" }}
            />
          </div>

          {/* Action bar */}
          <div style={{ padding: "10px 16px", background: "#151827", borderTop: "1px solid #0d0f1a" }}>
            <button onClick={handleRun} disabled={running} style={{
              background: "#232840", border: "1px solid #313654", color: "#cbd5e1",
              fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 4, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="#cbd5e1"><path d="M3 2l7 4-7 4V2z"/></svg>
              {running ? "Running…" : "Run"}
            </button>
          </div>

          {/* Output */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 200 }}>
            <div style={{ background: "#f7f8fa", borderBottom: "1px solid #e2e6ed", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em", color: "#2558d4", padding: "10px 0" }}>Output</span>
              {runOutput && (
                <span style={{ fontSize: 11, color: runOutput.exitCode === 0 ? "#16a34a" : "#dc2626" }}>
                  Exit {runOutput.exitCode} · {runOutput.duration}s
                </span>
              )}
            </div>
            <div style={{ flex: 1, padding: "14px 18px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7, overflowY: "auto" }}>
              {runOutput ? (
                <>
                  {runOutput.stdout && <pre style={{ margin: 0, color: "#162233" }}>{runOutput.stdout}</pre>}
                  {runOutput.stderr && <pre style={{ margin: 0, color: "#dc2626" }}>{runOutput.stderr}</pre>}
                  {!runOutput.stdout && !runOutput.stderr && <span style={{ color: "#94a3b8" }}>No output</span>}
                </>
              ) : <span style={{ color: "#94a3b8" }}>Run the code to see output.</span>}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 300, borderLeft: "1px solid #e2e6ed", padding: 20, background: "#fff" }}>
          <p style={{ fontSize: 10, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.07em", marginBottom: 8 }}>Teacher comment</p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            rows={6}
            style={{ width: "100%", resize: "vertical", fontSize: 13, color: "#162233", border: "1px solid #d1d5db", borderRadius: 4, padding: "8px 10px", boxSizing: "border-box", fontFamily: "inherit" }}
          />
          <button onClick={saveComment} style={{
            background: "#2558d4", color: "#fff", border: "none",
            fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 4, cursor: "pointer", marginTop: 10,
          }}>
            {commentSaved ? "Saved ✓" : "Save comment"}
          </button>
        </div>
      </div>

      {/* Delete confirmation dialog */}
      {confirmDelete && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 4px 24px rgba(0,0,0,.12)", padding: 32, maxWidth: 420, width: "90%" }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#dc2626", marginBottom: 12 }}>Delete submission?</h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
              This will permanently delete <strong style={{ color: "#162233" }}>{submission.studentName ?? "this student"}&apos;s</strong> submission. Their access code will be freed so they can resubmit.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmDelete(false)} style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={async () => {
                await fetch(`/api/teacher/submissions/${submission.id}`, { method: "DELETE" });
                window.location.href = "/teacher/dashboard";
              }} style={{ background: "#dc2626", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Winner confirmation dialog */}
      {confirmWinner && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 4px 24px rgba(0,0,0,.12)", padding: 32, maxWidth: 420, width: "90%" }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#162233", marginBottom: 12 }}>Confirm winner</h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
              Mark <strong style={{ color: "#162233" }}>{submission.studentName ?? "this student"}</strong> as the competition winner? This cannot be undone.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setConfirmWinner(false)} style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={confirmMarkWinner} style={{ background: "#162233", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>
                Confirm winner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
