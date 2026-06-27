import Link from "next/link";
import { db } from "@/lib/db";
import { competitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Logo } from "@/components/Logo";
import { CountdownTimer } from "@/components/CountdownTimer";

export const dynamic = "force-dynamic";

function fmtCountdown(deadlineIso: string) {
  const diff = new Date(deadlineIso).getTime() - Date.now();
  if (diff <= 0) return "Closed";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  if (d >= 1) return `${d}d ${h}h`;
  const m = Math.floor((diff % 3600000) / 60000);
  return `${h}h ${m}m`;
}

export default async function LandingPage() {
  const rawComps = await db
    .select()
    .from(competitions)
    .where(eq(competitions.active, true));

  // Open competitions first (soonest deadline → latest), then closed (most recently closed first)
  const now = Date.now();
  const activeComps = rawComps.slice().sort((a, b) => {
    const aT = new Date(a.deadline).getTime();
    const bT = new Date(b.deadline).getTime();
    const aClosed = aT <= now;
    const bClosed = bT <= now;
    if (aClosed !== bClosed) return aClosed ? 1 : -1;
    return aClosed ? bT - aT : aT - bT;
  });

  // Single-competition variant (existing layout)
  if (activeComps.length <= 1) {
    const comp = activeComps[0] ?? null;
    const deadline = comp?.deadline ?? new Date(Date.now() + 30 * 86400000).toISOString();
    const compName = comp?.name ?? "KCS Code Challenge";

    return (
      <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        <nav style={{ height: 60, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e6ed" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Logo />
            <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>{compName}</span>
          </div>
          <Link href="/teacher/login" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>Teacher login →</Link>
        </nav>
        <main style={{ flex: 1, background: "linear-gradient(180deg, #f7f8fa 0%, #fff 100%)", padding: "72px 32px 64px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <p style={{ fontSize: 11, color: "#2558d4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 18 }}>Autumn Term 2026</p>
          <h1 style={{ fontSize: 40, fontWeight: 700, color: "#162233", letterSpacing: "-0.025em", marginBottom: 18 }}>{compName}</h1>
          <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.65, maxWidth: 540, marginBottom: 44 }}>Write the best solution, run it against test cases, and submit your entry before the deadline.</p>
          <CountdownTimer deadline={deadline} />
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <Link href="/student/login" style={{ background: "#2558d4", color: "#fff", fontSize: 14, fontWeight: 500, padding: "13px 28px", borderRadius: 4, textDecoration: "none" }}>Enter competition code</Link>
          </div>
        </main>
        <footer style={{ padding: "16px 32px", borderTop: "1px solid #e2e6ed", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>© 2026 KCS Code Challenge. All rights reserved.</footer>
      </div>
    );
  }

  // Multi-competition variant
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <nav style={{ height: 60, padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "1px solid #e2e6ed" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>KCS Code Challenge</span>
        </div>
        <Link href="/teacher/login" style={{ fontSize: 13, color: "#64748b", textDecoration: "none" }}>Teacher login →</Link>
      </nav>

      <main style={{ flex: 1, background: "linear-gradient(180deg, #f7f8fa 0%, #fff 100%)" }}>
        <div style={{ padding: "56px 32px 24px", textAlign: "center" }}>
          <p style={{ fontSize: 11, color: "#2558d4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 14 }}>Autumn Term 2026</p>
          <h1 style={{ fontSize: 32, fontWeight: 700, color: "#162233", letterSpacing: "-0.02em", marginBottom: 12 }}>Open Competitions</h1>
          <p style={{ fontSize: 14, color: "#64748b", lineHeight: 1.6, maxWidth: 520, margin: "0 auto" }}>
            Choose your competition below. Enter the access code your teacher gave you to begin.
          </p>
        </div>

        <div style={{ padding: "8px 32px 36px", display: "flex", flexDirection: "column", gap: 14, maxWidth: 900, margin: "0 auto" }}>
          {activeComps.map((c, i) => {
            const countdown = fmtCountdown(c.deadline);
            const isClosed = new Date(c.deadline).getTime() <= Date.now();
            const isPrimary = i === 0 && !isClosed;
            return (
              <div key={c.id} style={{
                background: isClosed ? "#fafbfc" : "#fff",
                border: "1px solid #e2e6ed",
                borderRadius: 6,
                padding: "22px 24px",
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: isClosed ? 0.75 : 1,
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", marginBottom: 8 }}>
                    {isClosed ? (
                      <span style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Closed
                      </span>
                    ) : (
                      <span style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", fontSize: 10, fontWeight: 500, padding: "2px 8px", borderRadius: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                        Active
                      </span>
                    )}
                  </div>
                  <h3 style={{ fontSize: 18, fontWeight: 600, color: "#162233", margin: 0, marginBottom: 6 }}>{c.name}</h3>
                  {c.description && (
                    <p style={{ fontSize: 13, color: "#475569", margin: 0, marginBottom: 6, lineHeight: 1.55 }}>
                      {c.description}
                    </p>
                  )}
                  <p style={{ fontSize: 12, color: "#94a3b8", margin: 0, lineHeight: 1.5 }}>
                    Closes {new Date(c.deadline).toLocaleString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <div style={{ borderLeft: "1px solid #e2e6ed", paddingLeft: 24, textAlign: "right", display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                  <div>
                    <div style={{ fontSize: 10, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>
                      {isClosed ? "Closed on" : "Closes in"}
                    </div>
                    <div style={{ fontSize: 18, fontWeight: 600, color: isClosed ? "#94a3b8" : "#162233", fontFamily: "var(--font-mono)" }}>
                      {isClosed ? new Date(c.deadline).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : countdown}
                    </div>
                  </div>
                  {isClosed ? (
                    <span style={{ background: "#f1f5f9", color: "#94a3b8", border: "1px solid #e2e6ed", fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 4 }}>
                      Closed
                    </span>
                  ) : (
                    <Link
                      href={`/student/login?competition=${c.id}`}
                      style={{
                        background: isPrimary ? "#2558d4" : "#fff",
                        color: isPrimary ? "#fff" : "#2558d4",
                        border: isPrimary ? "none" : "1px solid #2558d4",
                        fontSize: 13, fontWeight: 500, padding: "8px 16px", borderRadius: 4, textDecoration: "none",
                      }}
                    >
                      Enter code →
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>

      <footer style={{ padding: "16px 32px", borderTop: "1px solid #e2e6ed", textAlign: "center", fontSize: 12, color: "#94a3b8" }}>
        {activeComps.length} competitions open · © 2026 KCS Code Challenge
      </footer>
    </div>
  );
}
