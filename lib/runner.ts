"use client";

interface PyodideAPI {
  setStdout: (opts: { batched: (s: string) => void }) => void;
  setStderr: (opts: { batched: (s: string) => void }) => void;
  setStdin: (opts: { stdin: () => string | null }) => void;
  runPythonAsync: (code: string) => Promise<unknown>;
}

declare global {
  interface Window {
    loadPyodide?: (opts: { indexURL: string }) => Promise<PyodideAPI>;
  }
}

const PYODIDE_VERSION = "0.26.2";
const PYODIDE_URL = `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`;

let pyodidePromise: Promise<PyodideAPI> | null = null;

function loadScript(src: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(s);
  });
}

async function getPyodide(): Promise<PyodideAPI> {
  if (!pyodidePromise) {
    pyodidePromise = (async () => {
      await loadScript(`${PYODIDE_URL}pyodide.js`);
      if (!window.loadPyodide) throw new Error("Pyodide loader missing");
      return window.loadPyodide({ indexURL: PYODIDE_URL });
    })();
  }
  return pyodidePromise;
}

export async function preloadPython(): Promise<void> {
  try { await getPyodide(); } catch { /* ignore */ }
}

interface RunResult { stdout: string; stderr: string; code: number; }

async function runPython(code: string, stdin: string): Promise<RunResult> {
  const py = await getPyodide();
  let stdout = "";
  let stderr = "";
  py.setStdout({ batched: (s) => { stdout += s + "\n"; } });
  py.setStderr({ batched: (s) => { stderr += s + "\n"; } });
  const lines = stdin.length ? stdin.split("\n") : [];
  let i = 0;
  py.setStdin({ stdin: () => (i < lines.length ? lines[i++] : null) });
  try {
    await py.runPythonAsync(code);
    return { stdout, stderr, code: 0 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const isEof = msg.includes("EOFError") || msg.includes("EOF when reading");
    const display = isEof
      ? "Your code calls input() but no input was provided.\nType your input values in the Input box above, then click Run again."
      : msg;
    return { stdout, stderr: stderr + display, code: 1 };
  }
}

async function runJavaScript(code: string, stdin: string): Promise<RunResult> {
  const lines = stdin.length ? stdin.split("\n") : [];
  let i = 0;
  let stdout = "";
  let stderr = "";
  const toStr = (a: unknown) => typeof a === "string" ? a : JSON.stringify(a);
  const sandboxConsole = {
    log: (...args: unknown[]) => { stdout += args.map(toStr).join(" ") + "\n"; },
    error: (...args: unknown[]) => { stderr += args.map(toStr).join(" ") + "\n"; },
    warn: (...args: unknown[]) => { stderr += args.map(toStr).join(" ") + "\n"; },
  };
  const input = () => (i < lines.length ? lines[i++] : "");
  try {
    const fn = new Function("console", "input", `return (async () => { ${code}\n })()`);
    await fn(sandboxConsole, input);
    return { stdout, stderr, code: 0 };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { stdout, stderr: stderr + msg, code: 1 };
  }
}

export interface TestCase { input: string; expected: string; }
export interface TestResult { input: string; expected: string; actual: string; pass: boolean; }
export interface RunOutput {
  stdout: string; stderr: string; exitCode: number; duration: string; testResults: TestResult[];
}

export async function runWithTests(code: string, language: string, testCases: TestCase[], customStdin = ""): Promise<RunOutput> {
  const runner = language === "javascript" ? runJavaScript : runPython;
  const start = Date.now();
  const testResults: TestResult[] = [];
  let firstRun: RunResult | null = null;
  for (const tc of testCases ?? []) {
    const r = await runner(code, tc.input);
    if (!firstRun) firstRun = r;
    const actual = r.stdout.trim();
    testResults.push({ input: tc.input, expected: tc.expected, actual, pass: actual === tc.expected.trim() });
  }
  if (!firstRun) firstRun = await runner(code, customStdin);
  return {
    stdout: firstRun.stdout,
    stderr: firstRun.stderr,
    exitCode: firstRun.code,
    duration: ((Date.now() - start) / 1000).toFixed(2),
    testResults,
  };
}
