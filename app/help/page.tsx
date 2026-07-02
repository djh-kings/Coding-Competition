import Link from "next/link";
import { Logo } from "@/components/Logo";

export const metadata = { title: "Student guide — KCS Code Challenge" };

const section: React.CSSProperties = { marginBottom: 32 };
const h2: React.CSSProperties = { fontSize: 20, fontWeight: 700, color: "#162233", marginBottom: 10, marginTop: 0 };
const p: React.CSSProperties = { fontSize: 15, color: "#334155", lineHeight: 1.65, marginBottom: 10 };
const ul: React.CSSProperties = { fontSize: 15, color: "#334155", lineHeight: 1.7, paddingLeft: 20, marginBottom: 10 };
const kbd: React.CSSProperties = { background: "#f1f5f9", padding: "1px 6px", borderRadius: 3, fontFamily: "var(--font-mono)", fontSize: 13 };
const note: React.CSSProperties = { background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: 6, padding: "12px 16px", marginBottom: 12, fontSize: 14, color: "#1e40af", lineHeight: 1.6 };

export default function StudentGuidePage() {
  return (
    <div style={{ minHeight: "100vh", background: "#f7f8fa" }}>
      <nav style={{ height: 60, padding: "0 32px", background: "#fff", borderBottom: "1px solid #e2e6ed", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
          <Logo />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>KCS Code Challenge</span>
        </Link>
        <Link href="/" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>← Home</Link>
      </nav>

      <main style={{ maxWidth: 720, margin: "48px auto", padding: "0 24px" }}>
        <p style={{ fontSize: 11, color: "#2558d4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 8 }}>Student guide</p>
        <h1 style={{ fontSize: 34, fontWeight: 700, color: "#162233", letterSpacing: "-0.02em", marginBottom: 8 }}>How to enter the competition</h1>
        <p style={{ fontSize: 15, color: "#64748b", lineHeight: 1.6, marginBottom: 40 }}>A quick walkthrough — from signing in to finding out if you won.</p>

        <section style={section}>
          <h2 style={h2}>1. Sign in</h2>
          <ul style={ul}>
            <li>Go to the home page and click <strong>Enter code →</strong> on the competition you want to enter.</li>
            <li>Type your <strong>access code</strong> (given to you by your teacher, e.g. <span style={kbd}>L4CS1-AB23CD</span>).</li>
            <li>Pick a <strong>name</strong> — this is how your entry will be credited.</li>
          </ul>
          <div style={note}>
            <strong>First time?</strong> Choose any name. It becomes your login for this competition — you&apos;ll need the same name if you sign in again later.
          </div>
        </section>

        <section style={section}>
          <h2 style={h2}>2. The workspace</h2>
          <ul style={ul}>
            <li><strong>Left panel</strong> — the problem statement. Read it carefully.</li>
            <li><strong>Top right</strong> — the code editor. Write your Python here.</li>
            <li><strong>Bottom right</strong> — the console. Your program&apos;s output appears here.</li>
          </ul>
          <div style={note}>
            Your code is <strong>saved to your account automatically</strong>. Close the tab, use a different computer — it&apos;ll all be there when you sign back in.
          </div>
        </section>

        <section style={section}>
          <h2 style={h2}>3. Run your code</h2>
          <p style={p}>Click the blue <strong>Run</strong> button. The first run takes a few seconds while Python loads. After that it&apos;s instant.</p>
          <p style={p}>If your code uses <span style={kbd}>input(&quot;…&quot;)</span> the prompt appears in the console with a blinking cursor — <strong>type your answer and press Enter</strong> to continue.</p>
          <p style={p}>Watch out for:</p>
          <ul style={ul}>
            <li><strong>Infinite loops</strong> — they&apos;ll freeze the tab. Click Run again to abort, or refresh the page.</li>
            <li><strong>Multi-line input</strong> — press Enter after each value, don&apos;t paste a whole block.</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={h2}>4. What works in Python here</h2>
          <p style={p}>Click the <strong>? Help</strong> button in the workspace top bar for the full list. In short:</p>
          <ul style={ul}>
            <li>✅ <strong>Works:</strong> everything in Python 3.12 — the standard library (<span style={kbd}>math</span>, <span style={kbd}>random</span>, <span style={kbd}>re</span>, <span style={kbd}>collections</span>, <span style={kbd}>itertools</span>, <span style={kbd}>json</span>, and more).</li>
            <li>❌ <strong>Doesn&apos;t work:</strong> <span style={kbd}>pip install</span>, internet access, reading files from your computer, GUI libraries like <span style={kbd}>tkinter</span> / <span style={kbd}>pygame</span> / <span style={kbd}>turtle</span>.</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={h2}>5. Submit</h2>
          <ul style={ul}>
            <li>When you&apos;re happy with your code, click <strong>Submit</strong>.</li>
            <li>Confirm — you can <strong>only submit once</strong>, so make sure it&apos;s your final answer.</li>
            <li>You&apos;ll see a <strong>confirmation code</strong> — write it down.</li>
            <li>You&apos;ll be taken to your dashboard.</li>
          </ul>
        </section>

        <section style={section}>
          <h2 style={h2}>6. Check your result</h2>
          <p style={p}>Sign back in any time with the same code + name — you&apos;ll land on your dashboard. It shows:</p>
          <ul style={ul}>
            <li>Your submitted code</li>
            <li>Whether you&apos;ve been <strong>shortlisted ★</strong></li>
            <li>Whether you <strong>won 🏆</strong></li>
            <li>Any comment your teacher left</li>
          </ul>
          <p style={p}>Or, visit <Link href="/results" style={{ color: "#2558d4" }}>/results</Link> and type just your confirmation code — no sign-in needed.</p>
        </section>

        <section style={section}>
          <h2 style={h2}>7. Something went wrong?</h2>
          <ul style={ul}>
            <li><strong>&quot;Code not recognised&quot;</strong> — double-check with your teacher.</li>
            <li><strong>&quot;That name doesn&apos;t match this access code&quot;</strong> — you used a different name last time. Try the one you first signed in with.</li>
            <li><strong>&quot;Already submitted&quot;</strong> — you&apos;ve already handed in. If it was a mistake, ask your teacher to reset it.</li>
            <li><strong>Anything else</strong> — tell your teacher.</li>
          </ul>
        </section>

        <div style={{ paddingTop: 24, borderTop: "1px solid #e2e6ed", display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/student/login" style={{ background: "#2558d4", color: "#fff", fontSize: 14, fontWeight: 500, padding: "10px 22px", borderRadius: 4, textDecoration: "none" }}>Sign in to compete →</Link>
          <Link href="/" style={{ background: "#fff", border: "1px solid #d1d5db", color: "#475569", fontSize: 14, fontWeight: 500, padding: "10px 22px", borderRadius: 4, textDecoration: "none" }}>Back to home</Link>
        </div>
      </main>
    </div>
  );
}
