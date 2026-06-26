"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { runWithTests, preloadPython } from "@/lib/runner";

const CodeEditor = dynamic(() => import("@/components/CodeEditor").then(m => ({ default: m.CodeEditor })), { ssr: false });

interface TestCase { input: string; expected: string; }
interface TestResult { input: string; expected: string; actual: string; pass: boolean; }
interface RunOutput { stdout: string; stderr: string; exitCode: number; duration: string; testResults: TestResult[]; }
interface Competition { id: string; name: string; deadline: string; problemHtml: string; testCases: TestCase[]; }

const DEFAULT_CODE = `# Write your solution here\n\n`;

export function WorkspaceClient() {
  const [comp, setComp] = useState<Competition | null>(null);
  const [code, setCode] = useState(DEFAULT_CODE);
  const [language, setLanguage] = useState("python");
  const [collapsed, setCollapsed] = useState(false);
  const [outputTab, setOutputTab] = useState<"output" | "testcases">("output");
  const [runOutput, setRunOutput] = useState<RunOutput | null>(null);
  const [running, setRunning] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [timer, setTimer] = useState("");

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

  async function handleRun() {
    if (!comp) return;
    setRunning(true);
    setOutputTab(comp.testCases?.length ? "testcases" : "output");
    try {
      setRunOutput(await runWithTests(code, language, comp.testCases));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      setRunOutput({ stdout: "", stderr: msg, exitCode: 1, duration: "0", testResults: [] });
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

  const passingCount = runOutput?.testResults.filter(r => r.pass).length ?? 0;
  const totalCount = runOutput?.testResults.length ?? 0;

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Top bar */}
      <div style={{ background: "#162233", padding: "10px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 500, color: "#94a3b8" }}>{comp?.name ?? "Loading…"}</span>
          <span style={{ color: "#374151", fontSize: 12 }}>·</span>
          <span style={{ fontSize: 12, color: "#64748b" }}>{timer}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{
            width: 6, height: 6, borderRadius: "50%", background: "#22c55e",
            animation: "pulse 2s ease-in-out infinite", display: "inline-block"
          }} />
          <span style={{ fontSize: 12, color: "#64748b" }}>Connected</span>
        </div>
      </div>

      {/* Split pane */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left: Problem */}
        <div style={{
          width: collapsed ? 40 : 380,
          flexShrink: 0,
          borderRight: "1px solid #e2e6ed",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.2s",
          overflow: "hidden",
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
                <div style={{ display: "flex", gap: 0 }}>
                  <button style={{ fontSize: 13, fontWeight: 500, color: "#2558d4", padding: "12px 12px", background: "none", border: "none", borderBottom: "2px solid #2558d4", cursor: "pointer" }}>Problem</button>
                </div>
                <button onClick={() => setCollapsed(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: "8px 12px" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
              </div>
              <div style={{ flex: 1, overflowY: "auto", padding: 22, fontSize: 13, color: "#475569", lineHeight: 1.7 }}
                dangerouslySetInnerHTML={{ __html: comp?.problemHtml ?? "<p>Loading…</p>" }}
              />
            </>
          )}
        </div>

        {/* Right: Editor + output */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          {/* Language bar */}
          <div style={{ padding: "8px 16px", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 12, color: "#64748b" }}>Language:</span>
            <select value={language} onChange={e => setLanguage(e.target.value)} style={{ fontSize: 13, color: "#162233", border: "1px solid #e2e6ed", borderRadius: 4, padding: "2px 8px", background: "#fff" }}>
              <option value="python">Python 3</option>
              <option value="javascript">JavaScript</option>
            </select>
          </div>

          {/* Code editor */}
          <CodeEditor value={code} onChange={setCode} language={language} height="280px" />

          {/* Action bar */}
          <div style={{ padding: "10px 16px", background: "#151827", borderTop: "1px solid #0d0f1a", display: "flex", gap: 8 }}>
            <button onClick={handleRun} disabled={running} style={{
              background: "#232840", border: "1px solid #313654", color: "#cbd5e1",
              fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 4, cursor: "pointer",
              display: "flex", alignItems: "center", gap: 6,
            }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="#cbd5e1"><path d="M3 2l7 4-7 4V2z"/></svg>
              {running ? "Running…" : "Run"}
            </button>
            <button onClick={() => setShowModal(true)} disabled={submitted} style={{
              background: "#2558d4", color: "#fff",
              fontSize: 13, fontWeight: 500, padding: "7px 16px", borderRadius: 4, border: "none", cursor: submitted ? "not-allowed" : "pointer", opacity: submitted ? 0.6 : 1,
            }}>
              Submit
            </button>
          </div>

          {/* Output panel */}
          <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ background: "#f7f8fa", borderBottom: "1px solid #e2e6ed", padding: "0 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex" }}>
                <button onClick={() => setOutputTab("output")} style={{
                  fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em",
                  padding: "10px 12px", background: "none", border: "none", cursor: "pointer",
                  color: outputTab === "output" ? "#2558d4" : "#94a3b8",
                  borderBottom: outputTab === "output" ? "2px solid #2558d4" : "2px solid transparent",
                }}>Output</button>
                <button onClick={() => setOutputTab("testcases")} style={{
                  fontSize: 11, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.07em",
                  padding: "10px 12px", background: "none", border: "none", cursor: "pointer",
                  color: outputTab === "testcases" ? "#2558d4" : "#94a3b8",
                  borderBottom: outputTab === "testcases" ? "2px solid #2558d4" : "2px solid transparent",
                  display: "flex", alignItems: "center", gap: 6,
                }}>
                  Test Cases
                  {runOutput && (
                    <span style={{ background: "#f0fdf4", color: "#16a34a", fontFamily: "var(--font-mono)", fontSize: 10, padding: "1px 6px", borderRadius: 10 }}>
                      {passingCount}/{totalCount}
                    </span>
                  )}
                </button>
              </div>
              {runOutput && (
                <span style={{ fontSize: 11, color: runOutput.exitCode === 0 ? "#16a34a" : "#dc2626" }}>
                  Exit {runOutput.exitCode} · {runOutput.duration}s
                </span>
              )}
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "14px 18px", fontFamily: "var(--font-mono)", fontSize: 13, lineHeight: 1.7 }}>
              {outputTab === "output" ? (
                runOutput ? (
                  <>
                    {runOutput.stdout && <pre style={{ margin: 0, color: "#162233", whiteSpace: "pre-wrap" }}>{runOutput.stdout}</pre>}
                    {runOutput.stderr && <pre style={{ margin: 0, color: "#dc2626", whiteSpace: "pre-wrap" }}>{runOutput.stderr}</pre>}
                    {!runOutput.stdout && !runOutput.stderr && <span style={{ color: "#94a3b8" }}>No output</span>}
                  </>
                ) : (
                  <span style={{ color: "#94a3b8" }}>Run your code to see output here.</span>
                )
              ) : (
                runOutput?.testResults.length ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {runOutput.testResults.map((r, i) => (
                      <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                        {[["Input", r.input], ["Expected", r.expected], ["Your output", r.actual]].map(([label, val]) => (
                          <div key={label} style={{
                            border: `1px solid ${r.pass ? "#bbf7d0" : "#fecaca"}`,
                            borderRadius: 4, padding: 8,
                          }}>
                            <div style={{ fontSize: 10, textTransform: "uppercase", color: "#94a3b8", marginBottom: 4 }}>{label}</div>
                            <pre style={{ margin: 0, fontSize: 12 }}>{val}</pre>
                          </div>
                        ))}
                      </div>
                    ))}
                    <div style={{ textAlign: "right", fontSize: 12, color: "#64748b" }}>{passingCount} of {totalCount} passing</div>
                  </div>
                ) : (
                  <span style={{ color: "#94a3b8" }}>Run your code to see test results.</span>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Submit confirmation modal */}
      {showModal && !submitted && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 4px 24px rgba(0,0,0,.12)", padding: 36, maxWidth: 480, width: "90%" }}>
            <h2 style={{ fontSize: 17, fontWeight: 600, color: "#162233", marginBottom: 12 }}>Submit your solution?</h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
              Once submitted, you cannot change your code. Make sure you&apos;re happy with your solution.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
              <button onClick={() => setShowModal(false)} style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 13, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={handleSubmit} style={{ background: "#2558d4", color: "#fff", border: "none", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 4, cursor: "pointer" }}>
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Submitted modal (permanent) */}
      {submitted && showModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#fff", borderRadius: 4, border: "1px solid #e2e6ed", boxShadow: "0 4px 24px rgba(0,0,0,.12)", padding: 36, maxWidth: 480, width: "90%" }}>
            <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 20 }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 11l4 4 8-8" stroke="#16a34a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <h2 style={{ fontSize: 19, fontWeight: 600, color: "#162233", marginBottom: 8 }}>Submission received</h2>
            <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, marginBottom: 20 }}>
              Your solution has been submitted. Keep this confirmation code safe.
            </p>
            <p style={{ fontSize: 11, fontWeight: 500, textTransform: "uppercase", color: "#94a3b8", letterSpacing: "0.07em", marginBottom: 8 }}>Confirmation code</p>
            <div style={{ display: "flex", borderRadius: 4, overflow: "hidden", border: "1px solid #e2e6ed", marginBottom: 16 }}>
              <span style={{ flex: 1, padding: "12px 14px", fontFamily: "var(--font-mono)", fontSize: 16, fontWeight: 500, letterSpacing: "0.05em", color: "#162233", background: "#f7f8fa" }}>
                {confirmationCode}
              </span>
              <button onClick={() => navigator.clipboard.writeText(confirmationCode ?? "")} style={{ background: "#162233", color: "#fff", border: "none", padding: "0 14px", cursor: "pointer" }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="4" width="8" height="9" rx="1" stroke="white" strokeWidth="1.2"/><path d="M4 4V3a1 1 0 011-1h6a1 1 0 011 1v7a1 1 0 01-1 1h-1" stroke="white" strokeWidth="1.2"/></svg>
              </button>
            </div>
            <p style={{ fontSize: 12, color: "#94a3b8" }}>
              Submitted {new Date().toLocaleDateString()}. You cannot resubmit.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}
