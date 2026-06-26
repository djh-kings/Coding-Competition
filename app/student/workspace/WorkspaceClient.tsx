"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { runWithTests, preloadPython, type RunOutput } from "@/lib/runner";

const CodeEditor = dynamic(() => import("@/components/CodeEditor").then(m => ({ default: m.CodeEditor })), { ssr: false });

interface Competition { id: string; name: string; deadline: string; problemHtml: string; }

const DEFAULT_CODE = `# Write your solution here\n\n`;

export function WorkspaceClient() {
  const [comp, setComp] = useState<Competition | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("python");
  const [collapsed, setCollapsed] = useState(false);
  const [shellLines, setShellLines] = useState<{ text: string; type: "info" | "out" | "err" | "input" }[]>([
    { text: "Python 3.12 (Pyodide) — type your input below, then click Run", type: "info" },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [timer, setTimer] = useState("");
  const shellRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch("/api/competition/active")
      .then(r => r.json())
      .then(setComp);
    preloadPython();
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
      setTimer(`${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")} remaining`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [comp]);

  useEffect(() => {
    if (shellRef.current) shellRef.current.scrollTop = shellRef.current.scrollHeight;
  }, [shellLines]);

  async function handleRun() {
    if (!comp) return;
    setRunning(true);
    setShellLines(prev => [
      ...prev,
      { text: ">>> Running…", type: "info" },
    ]);
    try {
      const result: RunOutput = await runWithTests(code, language, [], inputValue);
      setShellLines(prev => {
        const next = prev.filter(l => l.text !== ">>> Running…");
        next.push({ text: `>>> Run${inputValue.trim() ? ` (input: ${inputValue.trim().split("\n").join(", ")})` : ""}`, type: "info" });
        if (result.stdout) {
          for (const line of result.stdout.split("\n")) {
            if (line !== "") next.push({ text: line, type: "out" });
          }
        }
        if (result.stderr) {
          for (const line of result.stderr.split("\n")) {
            if (line !== "") next.push({ text: line, type: "err" });
          }
        }
        if (!result.stdout && !result.stderr) next.push({ text: "(no output)", type: "info" });
        return next;
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setShellLines(prev => {
        const next = prev.filter(l => l.text !== ">>> Running…");
        next.push({ text: msg, type: "err" });
        return next;
      });
    } finally {
      setRunning(false);
    }
  }

  async function handleSubmit() {
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
    }
  }

  function handleClear() {
    setShellLines([{ text: "Shell cleared.", type: "info" }]);
  }

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ background: "#162233", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}>{comp?.name ?? "Loading…"}</span>
          <span style={{ color: "#374151", fontSize: 12 }}>·</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>{timer}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={{ fontSize: 12, color: "#94a3b8", border: "1px solid #2d3748", borderRadius: 4, padding: "3px 8px", background: "#1e293b" }}>
            <option value="python">Python 3</option>
            <option value="javascript">JavaScript</option>
          </select>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", animation: "pulse 2s ease-in-out infinite", display: "inline-block" }} />
          <span style={{ fontSize: 12, color: "#64748b" }}>Connected</span>
        </div>
      </div>

      {/* Main area */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Problem panel */}
        <div style={{
          width: collapsed ? 40 : 340,
          flexShrink: 0,
          borderRight: "1px solid #e2e6ed",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s",
          overflow: "hidden",
          background: "#fff",
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
                dangerouslySetInnerHTML={{ __html: comp?.problemHtml ?? "<p>Loading…</p>" }}
              />
            </>
          )}
        </div>

        {/* Editor + Shell (IDLE style: editor top, shell bottom) */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", background: "#1e1e2e" }}>

          {/* Editor */}
          <div style={{ flex: "0 0 55%", minHeight: 0, display: "flex", flexDirection: "column", borderBottom: "2px solid #0d0f1a" }}>
            <div style={{ background: "#151827", padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Editor</span>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={handleRun} disabled={running} style={{
                  background: "#2558d4", border: "none", color: "#fff",
                  fontSize: 12, fontWeight: 600, padding: "5px 14px", borderRadius: 4, cursor: running ? "not-allowed" : "pointer",
                  opacity: running ? 0.7 : 1, display: "flex", alignItems: "center", gap: 6,
                }}>
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="white"><path d="M2 1l7 4-7 4V1z"/></svg>
                  {running ? "Running…" : "Run (F5)"}
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

          {/* Shell */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column" }}>
            <div style={{ background: "#0d0f1a", padding: "5px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0, borderBottom: "1px solid #1a1f35" }}>
              <span style={{ fontSize: 11, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.07em" }}>Shell</span>
              <button onClick={handleClear} style={{ background: "none", border: "none", color: "#475569", fontSize: 11, cursor: "pointer" }}>Clear</button>
            </div>

            {/* Shell output */}
            <div ref={shellRef} style={{ flex: 1, overflowY: "auto", padding: "10px 16px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7, background: "#0d0f1a" }}>
              {shellLines.map((line, i) => (
                <div key={i} style={{
                  color: line.type === "err" ? "#f87171" : line.type === "info" ? "#475569" : line.type === "input" ? "#a78bfa" : "#e2e8f0",
                  whiteSpace: "pre-wrap", wordBreak: "break-all",
                }}>
                  {line.text}
                </div>
              ))}
              {running && <div style={{ color: "#475569" }}>▋</div>}
            </div>

            {/* Input area */}
            <div style={{ background: "#0d0f1a", borderTop: "1px solid #1a1f35", padding: "8px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: 10, color: "#334155", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 4 }}>
                Input — type values your code needs (one per line), then click Run
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                <span style={{ color: "#475569", fontFamily: "var(--font-mono)", fontSize: 13, paddingTop: 6, flexShrink: 0 }}>stdin&gt;</span>
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={e => setInputValue(e.target.value)}
                  rows={2}
                  placeholder={"5\n10"}
                  style={{
                    flex: 1, background: "#111827", border: "1px solid #1e293b", borderRadius: 3,
                    color: "#a5b4fc", fontFamily: "var(--font-mono)", fontSize: 13,
                    padding: "5px 8px", resize: "vertical", outline: "none", boxSizing: "border-box",
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showModal && !submitted && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 4px 24px rgba(0,0,0,.12)", padding: 36, maxWidth: 480, width: "90%" }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#162233", marginBottom: 12 }}>Submit your solution?</h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
              Once submitted, you cannot change your code. Make sure you&apos;re happy with your solution.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleSubmit} style={{ background: "#2558d4", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted modal */}
      {submitted && showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 4px 24px rgba(0,0,0,.12)", padding: 36, maxWidth: 480, width: "90%" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 11l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 600, color: "#162233", marginBottom: 8 }}>Submission received</h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>Your solution has been submitted. Keep this confirmation code safe.</p>
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.07em", marginBottom: 8 }}>Confirmation code</p>
            <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", border: "1px solid #e2e6ed", marginBottom: 16 }}>
              <span style={{ flex: 1, padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 500, letterSpacing: "0.05em", color: "#162233", background: "#f7f8fa" }}>{confirmationCode}</span>
              <button onClick={() => navigator.clipboard.writeText(confirmationCode ?? "")} style={{ background: "#162233", color: "#fff", border: "none", padding: "0 14px", cursor: "pointer" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="4" width="8" height="9" rx="1" stroke="white" strokeWidth="1.2"/><path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1h-1" stroke="white" strokeWidth="1.2"/></svg>
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>Submitted {new Date().toLocaleDateString()}. You cannot resubmit.</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
    </div>
  );
}
