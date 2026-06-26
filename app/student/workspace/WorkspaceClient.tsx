"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";

const CodeEditor = dynamic(
  () => import("@/components/CodeEditor").then(m => ({ default: m.CodeEditor })),
  { ssr: false }
);

interface Competition { id: string; name: string; deadline: string; problemHtml: string; }

type TermLine =
  | { kind: "out"; text: string }
  | { kind: "err"; text: string }
  | { kind: "info"; text: string }
  | { kind: "input_echo"; text: string };

const DEFAULT_CODE = `# Write your solution here\n\n`;

export function WorkspaceClient() {
  const [comp, setComp] = useState<Competition | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("python");
  const [collapsed, setCollapsed] = useState(false);
  const [lines, setLines] = useState<TermLine[]>([
    { kind: "info", text: "Python 3.12 — press Run to execute your code" },
  ]);
  const [running, setRunning] = useState(false);
  const [waitingInput, setWaitingInput] = useState(false);
  const [inputVal, setInputVal] = useState("");
  const [timer, setTimer] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const termRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const controlBufRef = useRef<SharedArrayBuffer | null>(null);
  const dataBufRef = useRef<SharedArrayBuffer | null>(null);

  useEffect(() => {
    fetch("/api/competition/active").then(r => r.json()).then(setComp);
  }, []);

  useEffect(() => {
    if (!comp) return;
    const saved = localStorage.getItem(`code-${comp.id}`);
    if (saved) setCode(saved);
  }, [comp]);

  useEffect(() => {
    if (!comp) return;
    localStorage.setItem(`code-${comp.id}`, code);
  }, [code, comp]);

  useEffect(() => {
    if (!comp) return;
    const tick = () => {
      const diff = new Date(comp.deadline).getTime() - Date.now();
      if (diff <= 0) { setTimer("Competition closed"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setTimer(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")} remaining`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [comp]);

  useEffect(() => {
    if (termRef.current) termRef.current.scrollTop = termRef.current.scrollHeight;
  }, [lines, waitingInput]);

  useEffect(() => {
    if (waitingInput && inputRef.current) inputRef.current.focus();
  }, [waitingInput]);

  const appendLine = useCallback((line: TermLine) => {
    setLines(prev => [...prev, line]);
  }, []);

  function handleRun() {
    if (running) return;

    // Kill previous worker if any
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }

    setLines(prev => [
      ...prev,
      { kind: "info", text: "─────────────────────────" },
      { kind: "info", text: `>>> Run` },
    ]);
    setRunning(true);
    setWaitingInput(false);

    const controlBuf = new SharedArrayBuffer(8);   // Int32Array[2]: [state, len]
    const dataBuf = new SharedArrayBuffer(4096);   // Uint8Array for input text
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
      if (type === "stdout_char") {
        outBuf += char;
        if (char === "\n") flushOut();
      } else if (type === "stderr_char") {
        errBuf += char;
        if (char === "\n") flushErr();
      } else if (type === "stdout") {
        outBuf += text; flushOut();
      } else if (type === "stderr") {
        errBuf += text; flushErr();
      } else if (type === "input_needed") {
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

    worker.postMessage({ type: "run", code, language, controlBuf, dataBuf });
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
    if (e.key === "Enter") {
      e.preventDefault();
      submitInput();
    }
  }

  function handleClear() {
    setLines([{ kind: "info", text: "Shell cleared." }]);
  }

  async function handleSubmit() {
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, language }),
      });
      const data = await res.json();
      if (res.ok) {
        setConfirmationCode(data.confirmationCode);
        setSubmitted(true);
        setShowModal(true);
      } else {
        alert(data.error ?? `Submission failed (${res.status}). Please try again.`);
      }
    } catch {
      alert("Network error — please check your connection and try again.");
    }
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ background: "#162233", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}>{comp?.name ?? "Loading…"}</span>
          <span style={{ color: "#374151" }}>·</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>{timer}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{ fontSize: 12, color: "#94a3b8", border: "1px solid #2d3748", borderRadius: 4, padding: "3px 8px", background: "#1e293b" }}>
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript</option>
          </select>
        </div>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Problem panel */}
        <div style={{
          width: collapsed ? 40 : 340, flexShrink: 0, borderRight: "1px solid #e2e6ed",
          display: "flex", flexDirection: "column", transition: "width 0.2s", overflow: "hidden", background: "#fff",
        }}>
          {collapsed ? (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 16, gap: 12 }}>
              <button onClick={() => setCollapsed(false)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </button>
              <span style={{ fontSize: 10, textTransform: "uppercase", letterSpacing: "0.07em", color: "#94a3b8", writingMode: "vertical-rl", transform: "rotate(180deg)" }}>PROBLEM</span>
            </div>
          ) : (
            <>
              <div style={{ padding: "0 0 0 16px", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: "#2558d4", padding: "12px 0" }}>Problem</span>
                <button onClick={() => setCollapsed(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 12px" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 20, fontSize: 13, color: "#475569", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: comp?.problemHtml ?? "<p>Loading…</p>" }} />
            </>
          )}
        </div>

        {/* Editor + Shell */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#1e1e2e" }}>
          {/* Editor */}
          <div style={{ flex: "0 0 50%", minHeight: 0, display: "flex", flexDirection: "column", borderBottom: "2px solid #0d0f1a" }}>
            <div style={{ background: "#151827", padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#475569", textTransform: "uppercase", letterSpacing: "0.07em" }}>Editor</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleRun} disabled={running} style={{
                  background: "#2558d4", border: "none", color: "#fff",
                  fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 4,
                  cursor: running ? "not-allowed" : "pointer", opacity: running ? 0.7 : 1,
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="white"><path d="M2 1l7 4-7 4V1z"/></svg>
                  {running ? "Running…" : "Run"}
                </button>
                <button onClick={() => setShowModal(true)} disabled={submitted} style={{
                  background: submitted ? "#374151" : "#16a34a", color: "#fff", border: "none",
                  fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 4,
                  cursor: submitted ? "not-allowed" : "pointer", opacity: submitted ? 0.6 : 1,
                }}>
                  {submitted ? "Submitted ✓" : "Submit"}
                </button>
              </div>
            </div>
            <div style={{ flex: 1, minHeight: 0 }}>
              <CodeEditor value={code} onChange={setCode} language={language} height="100%" />
            </div>
          </div>

          {/* Shell / terminal */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
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

              {/* Inline input prompt */}
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
                <span style={{ color: "#94a3b8", animation: "blink 1s step-end infinite" }}>▋</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit modal */}
      {showModal && !submitted && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 4, padding: 36, maxWidth: 480, width: "90%", boxShadow: "0 4px 24px rgba(0,0,0,.15)" }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#162233", marginBottom: 12 }}>Submit your solution?</h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>Once submitted you cannot change your code.</p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmit} style={{ background: "#2558d4", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted modal */}
      {submitted && showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 4, padding: 36, maxWidth: 480, width: "90%", boxShadow: "0 4px 24px rgba(0,0,0,.15)" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 11l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 600, color: "#162233", marginBottom: 8 }}>Submission received!</h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
              Write down your confirmation code — you will need it to claim your prize if you win.
            </p>
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.07em", marginBottom: 8 }}>Your confirmation code</p>
            <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", border: "2px solid #2558d4", marginBottom: 24 }}>
              <span style={{ flex: 1, padding: "14px 16px", fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 700, color: "#162233", background: "#f7f8fa", letterSpacing: "0.1em" }}>{confirmationCode}</span>
              <button onClick={() => navigator.clipboard.writeText(confirmationCode ?? "")} title="Copy" style={{ background: "#162233", color: "#fff", border: "none", padding: "0 16px", cursor: "pointer" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="4" width="8" height="9" rx="1" stroke="white" strokeWidth="1.2"/><path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1h-1" stroke="white" strokeWidth="1.2"/></svg>
              </button>
            </div>
            <button
              onClick={async () => {
                await fetch("/api/student/logout", { method: "POST" });
                window.location.href = "/";
              }}
              style={{ width: "100%", background: "#2558d4", color: "#fff", border: "none", fontSize: 15, fontWeight: 600, padding: "12px", borderRadius: 4, cursor: "pointer" }}
            >
              OK — I have noted my code
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes blink { 0%, 100% { opacity: 1; } 50% { opacity: 0; } }
      `}</style>
    </div>
  );
}
