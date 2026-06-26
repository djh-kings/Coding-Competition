import Link from "next/link";
import { db } from "@/lib/db";
import { competitions } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Logo } from "@/components/Logo";
import { CountdownTimer } from "@/components/CountdownTimer";

export default async function LandingPage() {
  const rows = await db.select().from(competitions).where(eq(competitions.active, true)).limit(1);
  const comp = rows[0] ?? null;
  const deadline = comp?.deadline ?? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const compName = comp?.name ?? "KCS Code Challenge";

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      {/* Nav */}
      <nav style={{
        height: 60,
        padding: "0 32px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "1px solid #e2e6ed",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Logo />
          <span style={{ fontSize: 15, fontWeight: 600, color: "#162233" }}>{compName}</span>
        </div>
        <Link href="/teacher/login" style={{ fontSize: 13, fontWeight: 400, color: "#64748b", textDecoration: "none" }}>
          Teacher login →
        </Link>
      </nav>

      {/* Hero */}
      <main style={{
        flex: 1,
        background: "linear-gradient(180deg, #f7f8fa 0%, #fff 100%)",
        padding: "72px 32px 64px",
        textAlign: "center",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}>
        <p style={{ fontSize: 11, color: "#2558d4", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 18 }}>
          Autumn Term 2026
        </p>
        <h1 style={{ fontSize: 40, fontWeight: 700, color: "#162233", letterSpacing: "-0.025em", marginBottom: 18 }}>
          {compName}
        </h1>
        <p style={{ fontSize: 16, color: "#64748b", lineHeight: 1.65, maxWidth: 540, marginBottom: 44 }}>
          Write the best solution, run it against test cases, and submit your entry before the deadline.
        </p>

        <CountdownTimer deadline={deadline} />

        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <Link href="/student/login" style={{
            background: "#2558d4",
            color: "#fff",
            fontSize: 14,
            fontWeight: 500,
            padding: "13px 28px",
            borderRadius: 4,
            textDecoration: "none",
            display: "inline-block",
          }}>
            Enter competition code
          </Link>
          <a href="#" style={{
            background: "#fff",
            color: "#475569",
            fontSize: 14,
            fontWeight: 500,
            padding: "13px 28px",
            borderRadius: 4,
            textDecoration: "none",
            border: "1px solid #d1d5db",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1v8M4 6l3 3 3-3M2 11h10" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Download rules (PDF)
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        padding: "16px 32px",
        borderTop: "1px solid #e2e6ed",
        textAlign: "center",
        fontSize: 12,
        color: "#94a3b8",
      }}>
        © 2026 KCS Code Challenge. All rights reserved.
      </footer>
    </div>
  );
}
