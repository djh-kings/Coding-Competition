"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";

type TermLine =
  | { kind: "out"; text: string }
  | { kind: "err"; text: string }
  | { kind: "info"; text: string }
  | { kind: "input_echo"; text: string };

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
  const [lines, setLines] = useState<TermLine[]>([{ kind: "info", text: "Press Run to execute this submission" }]);
  const [running, setRunning] = useState(false);
  const [waitingInput, setWaitingInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [confirmWinner, setConfirmWinner] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const controlBufRef = useRef<SharedArrayBuffer | null>(null);
  const dataBufRef = useRef<SharedArrayBuffer | null>(null);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines, waitingInput]);

  useEffect(() => {
    if (waitingInput && inputRef.current) inputRef.current.focus();
  }, [waitingInput]);

  const appendLine = useCallback((line: TermLine) => {
    setLines(prev => [...prev, line]);
  }, []);

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

  function handleRun() {
    if (running) return;
    if (workerRef.current) { workerRef.current.terminate(); workerRef.current = null; }

    setLines(prev => [...prev, { kind: "info", text: "─────────────────────────" }, { kind: "info", text: ">>> Run" }]);
    setRunning(true);
    setWaitingInput(false);

    const controlBuf = new SharedArrayBuffer(8);
    const dataBuf = new SharedArrayBuffer(4096);
    controlBufRef.current = controlBuf;
    dataBufRef.current = dataBuf;

    const worker = new Worker("/pyodide-worker.js");
    workerRef.current = worker;

    let outBuf = "";
    let errBuf = "";
    const flushOut = () => {
      if (!outBuf) return;
      const parts = outBuf.split("\n");
      for (let i = 0; i < parts.length - 1; i++) appendLine({ kind: "out", text: parts[i] });
      outBuf = parts[parts.length - 1];
    };
    const flushErr = () => {
      if (!errBuf) return;
      const parts = errBuf.split("\n");
      for (let i = 0; i < parts.length - 1; i++) appendLine({ kind: "err", text: parts[i] });
      errBuf = parts[parts.length - 1];
    };

    worker.onmessage = (e) => {
      const { type, text, char, exitCode } = e.data;
      if (type === "stdout_char") { outBuf += char; if (char === "\n") flushOut(); }
      else if (type === "stderr_char") { errBuf += char; if (char === "\n") flushErr(); }
      else if (type === "stdout") { outBuf += text; flushOut(); }
      else if (type === "stderr") { errBuf += text; flushErr(); }
      else if (type === "input_needed") {
        if (outBuf) { appendLine({ kind: "out", text: outBuf }); outBuf = ""; }
        setWaitingInput(true);
      } else if (type === "done") {
        if (outBuf) { appendLine({ kind: "out", text: outBuf }); outBuf = ""; }
        if (errBuf) { appendLine({ kind: "err", text: errBuf }); errBuf = ""; }
        setRunning(false);
        setWaitingInput(false);
        if (exitCode === 0) appendLine({ kind: "info", text: "Finished" });
        worker.terminate();
        workerRef.current = null;
      }
    };

    worker.postMessage({ type: "run", code: submission.code, language: submission.language, controlBuf, dataBuf });
  }

  function submitInput() {
    if (!waitingInput || !controlBufRef.current || !dataBufRef.current) return;
    const val = inputVal;
    setInputVal("");
    setWaitingInput(false);
    appendLine({ kind: "input_echo", text: val });
    const control = new Int32Array(controlBufRef.current);
    const dataArr = new Uint8Array(dataBufRef.current);
    const encoded = new TextEncoder().encode(val + "\n");
    dataArr.set(encoded, 0);
    Atomics.store(control, 1, encoded.length);
    Atomics.store(control, 0, 1);
    Atomics.notify(control, 0);
  }

  function handleInputKey(e: React.KeyboardEvent) {
    if (e.key === "Enter") { e.preventDefault(); submitInput(); }
  }

  function handleClear() {
    setLines([{ kind: "info", text: "Shell cleared." }]);
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
        {/* Left: read-only editor + IDLE console */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", minHeight: 0 }}>
          <div style={{ flex: "0 0 50%", minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ background: "#f7f8fa", padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid #e2e6ed" }}>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Submitted code (read-only)</span>
              <button onClick={handleRun} disabled={running} style={{
                background: "#2558d4", border: "none", color: "#fff",
                fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 4,
                cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.7 : 1,
                display: "flex", alignItems: "center", gap: 6,
              }}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="white"><path d="M2 1l7 4-7 4V1z"/></svg>
                {running ? "Running…" : "Run"}
              </button>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <CodeEditor value={submission.code} language={submission.language} readOnly height="100%" />
            </div>
          </div>

          {/* Console */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", borderTop: "2px solid #e2e6ed" }}>
            <div style={{ background: "#f7f8fa", padding: "5px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid #e2e6ed" }}>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Console</span>
              <button onClick={handleClear} style={{ background: "none", border: "none", color: "#94a3b8", fontSize: 11, cursor: "pointer" }}>Clear</button>
            </div>
            <div
              ref={termRef}
              onClick={() => waitingInput && inputRef.current?.focus()}
              style={{ flex: 1, overflowY: "auto", padding: "12px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.9, background: "#ffffff", cursor: waitingInput ? "text" : "default" }}
            >
              {lines.map((l, i) => (
                <div key={i} style={{
                  color: l.kind === "err" ? "#dc2626" : l.kind === "info" ? "#94a3b8" : l.kind === "input_echo" ? "#2558d4" : "#162233",
                  whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}>
                  {l.text}
                </div>
              ))}

              {waitingInput && (
                <div style={{ display: "flex", alignItems: "center" }}>
                  <input
                    ref={inputRef}
                    value={inputVal}
                    onChange={e => setInputVal(e.target.value)}
                    onKeyDown={handleInputKey}
                    autoFocus
                    style={{
                      background: "transparent", border: "none", outline: "none",
                      color: "#2558d4", fontFamily: "var(--font-mono)", fontSize: 13,
                      flex: 1, caretColor: "#2558d4", padding: 0,
                    }}
                  />
                  <span style={{ color: "#94a3b8", fontSize: 11, marginLeft: 8 }}>↵ Enter</span>
                </div>
              )}

              {running && !waitingInput && (
                <span style={{ color: "#94a3b8" }}>▋</span>
              )}
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
